import { Suspense } from "react";
import Link from "next/link";
import TaskGrid from "@/components/dashboard/TaskGrid";
import { getAllTasks } from "@/lib/data.server";
import { getActiveWorkspace } from "@/lib/workspace.server";

export const revalidate = 30;

export default async function TasksPage() {
  const workspace = await getActiveWorkspace();
  const tasks = await getAllTasks(workspace.id);

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

          <Link
            href="/tasks/new"
            className="
              inline-flex w-fit items-center gap-2
              rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold
              text-white shadow-(--clay-drop) transition hover:brightness-105
            "
          >
            <span className="text-lg leading-none">+</span>
            New Task
          </Link>
        </div>

        <Suspense fallback={null}>
          <TaskGrid serverTasks={tasks} showProjectName />
        </Suspense>
      </div>
    </main>
  );
}