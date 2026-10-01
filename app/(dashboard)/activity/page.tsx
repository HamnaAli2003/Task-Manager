// Activity page — REAL workspace-scoped activity from ActivityEvent.
// Server component: everything filters by the ACTIVE workspace.
import { requireUser, getActiveWorkspace } from "@/lib/workspace.server";
import { listWorkspaceActivity } from "@/lib/activity.server";
import ActivityDeleteButton from "@/components/dashboard/ActivityDeleteButton";

function initialsOf(name: string | null | undefined): string {
    return (name ?? "?")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

const BADGE: Record<string, string> = {
    INVITE_SENT: "bg-info/15 text-info",
    MEMBER_JOINED: "bg-success/15 text-success",
    MEMBER_REMOVED: "bg-danger/15 text-danger",
    TASK_CREATED: "bg-accent/15 text-accent",
    TASK_UPDATED: "bg-info/15 text-info",
    TASK_STATUS_CHANGED: "bg-warning/15 text-warning",
    TASK_ASSIGNED: "bg-accent/15 text-accent",
    TASK_COMPLETED: "bg-success/15 text-success",
};

const LABEL: Record<string, string> = {
    INVITE_SENT: "Invite",
    MEMBER_JOINED: "Joined",
    MEMBER_REMOVED: "Removed",
    TASK_CREATED: "Created",
    TASK_UPDATED: "Updated",
    TASK_STATUS_CHANGED: "Status",
    TASK_ASSIGNED: "Assigned",
    TASK_COMPLETED: "Completed",
};

export default async function ActivityPage() {
    const user = await requireUser();
    const workspace = await getActiveWorkspace();
    const activities = await listWorkspaceActivity(workspace.id, 50, user.id);

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        Workspace
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                        Activity
                    </h1>

                    <p className="mt-2 text-sm text-text-secondary">
                        What has been happening in{" "}
                        <span className="font-semibold">{workspace.name}</span>.
                    </p>
                </div>

                <section className="rounded-2xl border border-glass-border bg-glass-bg p-5 shadow-lg backdrop-blur-xl">
                    {activities.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-clay-edge p-6 text-center text-sm text-text-muted">
                            No activity yet in this workspace.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {activities.map(
                                (activity: Awaited<ReturnType<typeof listWorkspaceActivity>>[number]) => (
                                    <article
                                        key={activity.id}
                                        className="flex items-start gap-4 rounded-xl border border-border-light bg-surface-elevated p-4"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                                            {initialsOf(activity.actorName)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-text">{activity.message}</p>

                                            <div className="mt-1 flex items-center gap-2">
                                                <span
                                                    className={`
                          rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                          ${BADGE[activity.type] ?? "bg-text-muted/10 text-text-muted"}
                        `}
                                                >
                                                    {LABEL[activity.type] ?? activity.type}
                                                </span>

                                                <p className="text-xs text-text-muted">
                                                    {timeAgo(activity.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <ActivityDeleteButton
                                            activityId={activity.id}
                                            message={activity.message}
                                            showSharedVisibility={workspace.type === "TEAM"}
                                        />
                                    </article>
                                ),
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
