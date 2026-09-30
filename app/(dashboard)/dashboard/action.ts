"use server";

import { getActiveWorkspace, requireUser } from "@/lib/workspace.server";
import { listWorkspaceActivity } from "@/lib/activity.server";

/** Live Activity widget feed — ACTIVE workspace only, newest 20. */
export async function getWorkspaceActivityAction() {
    await requireUser();
    const workspace = await getActiveWorkspace();

    const events = await listWorkspaceActivity(workspace.id, 20);

    type WorkspaceActivityEvent = {
        id: string;
        type: string;
        message: string;
        actorName: string | null;
        createdAt: Date;
    };

    return events.map((event: WorkspaceActivityEvent) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        actorName: event.actorName,
        createdAt: event.createdAt.toISOString(),
    }));
}
