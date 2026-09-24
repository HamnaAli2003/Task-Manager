"use client";

import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/lib/dataStore";
import TaskGrid from "./TaskGrid";

export default function ProjectTasksClient({
  projectId,
}: {
  projectId: string;
}) {
  const project = useDataStore((state) =>
    state.projects.find((item) => item.id === projectId)
  );
  const tasks = useDataStore(
    useShallow((state) =>
      state.tasks.filter((task) => task.projectId === projectId)
    )
  );
  const hydrated = useDataStore((state) => state._hasHydrated);

  if (hydrated && !project) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-border-light bg-glass-bg p-12 text-center">
        <h1 className="text-base font-semibold text-text">Project not found</h1>

        <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
          This project may have been deleted.
        </p>

        <Link
          href="/projects"
          className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
        >
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {project?.name ?? "Project"}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Tasks
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} in this
            project.
          </p>
        </div>

        <Link
          href={`/projects/${projectId}/tasks/new`}
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

      <div className="mt-8">
        <TaskGrid serverTasks={tasks} projectId={projectId} showProjectName />
      </div>
    </>
  );
}