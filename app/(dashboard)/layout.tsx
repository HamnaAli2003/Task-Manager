import Orbs from "@/components/Orbs";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DataSync from "@/components/dashboard/DataSync";
import UserSync from "@/components/dashboard/UserSync";
import { auth } from "@/auth";
import { getAllTasks, getProjects } from "@/lib/data.server";
import { getActiveWorkspace, getUserWorkspaces } from "@/lib/workspace.server";
import { getUnreadNotificationCount } from "@/lib/notifications.server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Must run FIRST — it may create the user's very first workspace
  // ("Personal Workspace") if they have none.
  const activeWorkspace = await getActiveWorkspace();

  // Only then list all workspaces for the switcher dropdown.
  const workspaces = await getUserWorkspaces(session.user.id);

  // Everything below is scoped to the ACTIVE workspace only.
  const [projects, tasks, unreadCount] = await Promise.all([
    getProjects(activeWorkspace.id),
    getAllTasks(activeWorkspace.id),
    getUnreadNotificationCount(session.user.id),
  ]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <DataSync projects={projects} tasks={tasks} />
      <UserSync user={session.user} />

      <DashboardSidebar
        projects={projects}
        unreadCount={unreadCount}
        workspaces={workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          type: workspace.type,
          logoUrl: workspace.logoUrl,
        }))}
        activeWorkspaceId={activeWorkspace.id}
      >
        <div className="relative min-h-screen overflow-hidden">
          <Orbs subtle />

          <div className="relative z-10 min-w-0">
            {children}
          </div>
        </div>
      </DashboardSidebar>
    </div>
  );
}
