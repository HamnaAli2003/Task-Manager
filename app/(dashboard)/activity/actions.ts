"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace, requireUser } from "@/lib/workspace.server";

export async function dismissActivityEventAction(activityId: string) {
    const user = await requireUser();
    const workspace = await getActiveWorkspace();

    const event = await prisma.activityEvent.findFirst({
        where: { id: activityId, workspaceId: workspace.id },
        select: { id: true },
    });

    if (!event) {
        return { ok: false, error: "Activity event not found." };
    }

    await prisma.activityEventDismissal.upsert({
        where: {
            activityEventId_userId: { activityEventId: event.id, userId: user.id },
        },
        create: { activityEventId: event.id, userId: user.id },
        update: {},
    });

    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/members");

    return { ok: true };
}