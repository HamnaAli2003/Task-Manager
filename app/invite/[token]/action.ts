"use server";

// Invite accept action (M3).
// Order: validate token → check email binding → transaction (membership +
// usedAt) → notifications → redirect. Success never returns a value here —
// redirect() throws a control-flow error Next.js handles.
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    emitInviteAcceptedEvent,
    emitMemberJoinedEvent,
} from "@/lib/notifications.server";
import { logActivityEvent } from "@/lib/activity.server";

const WORKSPACE_COOKIE = "pmp-workspace";

export type AcceptInviteResult = { ok: boolean; error?: string };

export async function acceptInviteAction(
    token: string
): Promise<AcceptInviteResult> {
    // 1) Must be logged in (the page hides the button for guests, this is the guard).
    const session = await auth();
    const user = session?.user;

    if (!user?.id || !user.email) {
        return { ok: false, error: "Please log in first, then open this link again." };
    }
    const userId = user.id;

    // 2) Load the invite. One generic error for unknown / used / expired —
    //    never reveal workspace details for dead links.
    const invite = await prisma.invite.findUnique({
        where: { token },
        select: {
            id: true,
            email: true,
            role: true,
            workspaceId: true,
            expiresAt: true,
            usedAt: true,
            createdById: true,
        },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return { ok: false, error: "This invite is invalid, expired, or already used." };
    }

    // 3) Email-bound invite: only that account can accept it.
    if (invite.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return {
            ok: false,
            error: `This invite was issued to ${invite.email}. Log in with that account.`,
        };
    }

    // 4) Join + consume the invite atomically.
    let alreadyMember = false;

    await prisma.$transaction(async (tx) => {
        const existing = await tx.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId: invite.workspaceId, userId },
            },
            select: { id: true },
        });

        alreadyMember = Boolean(existing);

        if (!existing) {
            await tx.workspaceMember.create({
                data: {
                    workspaceId: invite.workspaceId,
                    userId,
                    role: invite.role, // role decided when the invite was created
                },
            });
        }

        // One-time use: dead link after this, even if the accept partially failed later.
        await tx.invite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        });
    });

    // 5) Notifications — only when someone actually NEW joined
    //    (no duplicate rows, no MEMBER_JOINED spam for existing members).
    if (!alreadyMember) {
            // MEMBER history log — invite accepted, membership created.
    await logActivityEvent({
      workspaceId: invite.workspaceId,
      category: "MEMBER",
      type: "MEMBER_JOINED",
      actorName: user.name ?? user.email ?? "Someone",
      targetName: user.name ?? user.email ?? "Someone",
      message: `${user.name ?? user.email ?? "Someone"} joined the workspace via invite.`,
    });

        await emitInviteAcceptedEvent({
            workspaceId: invite.workspaceId,
            inviterId: invite.createdById,
            memberId: userId,
            memberName: user.name ?? undefined,
        });

        await emitMemberJoinedEvent(invite.workspaceId, userId);
    }

    // 6) Make the joined workspace the active one so the next /dashboard
    //    load shows THIS team workspace's projects (and the switcher marks
    //    👥 {name} as active). Cookie is only a hint — membership is
    //    verified server-side on every request.
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, invite.workspaceId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });

    // 7) Done — send them in.
    redirect("/dashboard");
}
