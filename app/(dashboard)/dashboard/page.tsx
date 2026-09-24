import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DueTasksClient from "@/components/dashboard/DueTasksClient";
import LiveActivity from "@/components/dashboard/LiveActivity";
import PriorityMix from "@/components/dashboard/PriorityMix";
import ProjectsGrid from "@/components/dashboard/ProjectsGrid";
import { getProjects } from "@/lib/data.server";
import { getActiveWorkspace } from "@/lib/workspace.server";

export default async function DashboardPage() {
  const workspace = await getActiveWorkspace();
  const projects = await getProjects(workspace.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
        <DashboardHeader />

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

              <Link
                href="/projects"
                className="
                  text-xs font-semibold
                  text-accent
                  transition hover:text-accent-2
                "
              >
                View all →
              </Link>
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