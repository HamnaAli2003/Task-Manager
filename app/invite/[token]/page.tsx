// PUBLIC invite accept page — outside the (dashboard) group, so no auth gate.
// Shows a workspace preview card based on the unguessable token, or a
// friendly error screen for invalid / expired / used invites.
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import InviteAcceptButton from "../[token]/InviteAcceptButton";

type Props = {
  params: Promise<{ token: string }>;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: string): string {
  return role === "OWNER" ? "Owner" : "Member";
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { id: true, name: true, logoUrl: true, _count: { select: { members: true } } },
      },
      createdBy: { select: { name: true } },
    },
  });

  // One generic error screen for: unknown token, already used, or expired.
  // Never reveal workspace details for dead links (no data leak).
  const isExpired = invite ? invite.expiresAt < new Date() : false;
  if (!invite || invite.usedAt || isExpired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-text">
        <div className="w-full max-w-md rounded-[30px] border border-clay-edge bg-clay-bg p-8 text-center shadow-(--clay-card)">
          <h1 className="text-lg font-bold">Invite not available</h1>
          <p className="mt-2 text-sm text-text-muted">
            This invite link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-(--clay-drop) transition hover:-translate-y-0.5"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const { workspace, createdBy } = invite;
  const loggedIn = Boolean(session?.user);

  // Display-level check for email-bound invites (the action enforces it too).
  const emailMismatch =
    Boolean(invite.email) &&
    loggedIn &&
    session?.user?.email?.toLowerCase() !== invite.email?.toLowerCase();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-text">
      <div className="w-full max-w-md rounded-[30px] border border-clay-edge bg-clay-bg p-8 shadow-(--clay-card)">
        {/* Workspace identity */}
        <div className="flex items-center gap-4">
          {workspace.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workspace.logoUrl}
              alt={workspace.name}
              className="size-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-base font-bold text-white">
              {initials(workspace.name)}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{workspace.name}</h1>
            <p className="text-xs text-text-muted">
              {workspace._count.members} member
              {workspace._count.members === 1 ? "" : "s"} · You&apos;ll join as{" "}
              {roleLabel(invite.role)}
            </p>
          </div>
        </div>

        {/* Inviter line */}
        <p className="mt-5 text-sm text-text-secondary">
          <span className="font-semibold">{createdBy.name ?? "Someone"}</span> invited
          you to collaborate in this workspace.
        </p>

        {/* States */}
        {!loggedIn && (
          <div className="mt-6 space-y-3">
            <p className="rounded-2xl border border-clay-edge bg-field-bg p-3 text-xs text-text-muted">
              You need to log in (or create an account) with{" "}
              {invite.email ? (
                <span className="font-semibold">{invite.email}</span>
              ) : (
                "any account"
              )}{" "}
              to accept. After logging in, open this link again.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white shadow-(--clay-drop) transition hover:-translate-y-0.5"
            >
              Log in to accept
            </Link>
          </div>
        )}

        {loggedIn && emailMismatch && (
          <p className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
            This invite was issued to{" "}
            <span className="font-semibold">{invite.email}</span> but you are signed
            in as <span className="font-semibold">{session?.user?.email}</span>.
          </p>
        )}

        {loggedIn && !emailMismatch && (
          <InviteAcceptButton token={invite.token} />
        )}
      </div>
    </main>
  );
}
