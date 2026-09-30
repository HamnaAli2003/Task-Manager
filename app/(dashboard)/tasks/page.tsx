import { Suspense } from "react";
import Link from "next/link";
import TaskGrid from "@/components/dashboard/TaskGrid";
import { getAllTasks, getProjects } from "@/lib/data.server";
import { getActiveWorkspace, requireUser } from "@/lib/workspace.server";
import { getProjectAccess } from "@/lib/access.server";

export const revalidate = 30;

export default async function TasksPage() {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();
  const [projects, allTasks] = await Promise.all([
    getProjects(workspace.id),
    getAllTasks(workspace.id),
  ]);
  const projectIds = projects.map((project) => project.id);
  const accessEntries = await Promise.all(
    projectIds.map(async (projectId) => [
      projectId,
      await getProjectAccess(user.id, projectId),
    ] as const),
  );
  const accessByProjectId = Object.fromEntries(accessEntries);
  const tasks = allTasks.filter(
    (task) => accessByProjectId[task.projectId]?.canView,
  );
  const canCreateTasks = Object.values(accessByProjectId).some(
    (access) => access.canCreateTasks,
  );

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Workspace
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Tasks
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} across all
              projects.
            </p>
          </div>

          {canCreateTasks ? <Link
            href="/tasks/new"
            className="
              inline-flex w-fit items-center gap-2
              rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold
              text-white shadow-(--clay-drop) transition hover:brightness-105
            "
          >
            <span className="text-lg leading-none">+</span>
            New Task
          </Link> : null}
        </div>

        <Suspense fallback={null}>
          <TaskGrid
            serverTasks={tasks}
            showProjectName
            accessByProjectId={accessByProjectId}
          />
        </Suspense>
      </div>
    </main>
  );
}