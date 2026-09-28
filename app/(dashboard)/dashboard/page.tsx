import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DueTasksClient from "@/components/dashboard/DueTasksClient";
import LiveActivity from "@/components/dashboard/LiveActivity";
import PriorityMix from "@/components/dashboard/PriorityMix";
import ProjectsGrid from "@/components/dashboard/ProjectsGrid";
import Link from "next/link";
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
          hasProjects={projects.length > 0}
        />

        <DashboardStats />

        {projects.length === 0 ? (
          <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.65fr_0.75fr]">
            <section className="flex min-h-64 flex-col items-start justify-center rounded-3xl border border-glass-border bg-glass-bg p-7 shadow-(--clay-deep) backdrop-blur-xl sm:p-9">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-xl font-semibold text-accent">
                +
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-accent">
                Start here
              </p>
              <h2 className="mt-2 text-xl font-bold text-text">
                Give your workspace its first project
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                Projects bring tasks, priorities, and due dates together. Create
                one to get your workspace moving.
              </p>
              <Link
                href="/projects/new"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-(--clay-drop) transition hover:-translate-y-0.5 hover:brightness-105"
              >
                <span className="text-lg leading-none">+</span>
                Create your first project
              </Link>
            </section>

            <LiveActivity />
          </section>
        ) : (
          <>
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

                <ProjectsGrid
                  serverProjects={projects}
                  maxColumns={2}
                  maxItems={6}
                  showMoreHref="/projects"
                  compact
                />
              </section>

              <PriorityMix />
            </section>

            <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.65fr_0.75fr]">
              <DueTasksClient />

              <LiveActivity />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
