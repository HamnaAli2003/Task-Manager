import { requireUser } from "@/lib/workspace.server";
import { listNotifications } from "@/lib/notifications.server";
import NotificationList from "./NotificationList";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);

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
            Updates from your workspaces.
          </p>
        </div>

        <NotificationList notifications={notifications} />
      </div>
    </main>
  );
}