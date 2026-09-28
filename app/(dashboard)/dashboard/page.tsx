import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DueTasksClient from "@/components/dashboard/DueTasksClient";
import LiveActivity from "@/components/dashboard/LiveActivity";
import PriorityMix from "@/components/dashboard/PriorityMix";
import ProjectsGrid from "@/components/dashboard/ProjectsGrid";
import { getProjects } from "@/lib/data.server";
import { getActiveWorkspace, requireUser } from "@/lib/workspace.server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  const [projects, membership] = await Promise.all([
    getProjects(workspace.id),
    prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
      select: { role: true },
    }),
  ]);

  // Owner-only invite rights (server-fetched — the client can't fake this;
  // the action re-verifies anyway).
  const canInvite =
    workspace.type === "TEAM" && membership?.role === "OWNER";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
        <DashboardHeader
          workspaceId={workspace.id}
          workspaceType={workspace.type}
          canInvite={canInvite}
        />

        <DashboardStats />

        <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.65fr_0.75fr]">
          <section className="rounded-3xl border border-glass-border bg-glass-bg p-5 shadow-(--clay-deep) backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">
                  Recently Active Projects
                </h2>

                <p className="mt-1 text-xs text-text-muted">
                  Projects currently receiving activity.
                </p>
              </div>
            </div>

            <div className="hide-scrollbar -mr-3 max-h-120 overflow-y-auto pr-3 overscroll-contain">
              <ProjectsGrid serverProjects={projects} maxColumns={2} />
            </div>
          </section>

          <PriorityMix />
        </section>

        <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.65fr_0.75fr]">
          <DueTasksClient />

          <LiveActivity />
        </section>
      </div>
    </main>
  );
}
