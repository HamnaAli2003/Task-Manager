import { requireUser, getActiveWorkspace } from "@/lib/workspace.server";
import { listNotifications } from "@/lib/data.server";
import NotificationList from "./NotificationList";

export default async function NotificationsPage() {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();
  const notifications = await listNotifications(user.id, workspace.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Workspace
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Updates from <span className="font-semibold">{workspace.name}</span>.
            Switch workspaces to see their notifications.
          </p>
        </div>

        <NotificationList notifications={notifications} />
      </div>
    </main>
  );
}
