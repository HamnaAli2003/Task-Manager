import Link from "next/link";
import ProjectsGrid from "@/components/dashboard/ProjectsGrid";
import { getProjects } from "@/lib/data.server";
import { getActiveWorkspace } from "@/lib/workspace.server";

export default async function ProjectsPage() {
  const workspace = await getActiveWorkspace();
  const projects = await getProjects(workspace.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Workspace
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Manage your projects, track progress, and stay on top of upcoming
              work.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="
              inline-flex items-center justify-center
              rounded-xl bg-accent px-4 py-2.5
              text-sm font-semibold text-white
              shadow-lg transition hover:bg-accent-hover
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            "
          >
            + New Project
          </Link>
        </div>

        <ProjectsGrid serverProjects={projects} />
      </div>
    </main>
  );
}