"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import TaskForm from "@/components/dashboard/TaskForm";
import { useDataStore } from "@/lib/dataStore";

export default function NewProjectTaskPage() {
  const { id } = useParams<{ id: string }>();
  const project = useDataStore((state) =>
    state.projects.find((item) => item.id === id)
  );
  const addTask = useDataStore((state) => state.addTask);

  if (!project) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
          <Link
            href="/projects"
            className="
              text-sm font-semibold text-accent
              transition hover:text-accent-hover hover:underline
              underline-offset-4
            "
          >
            ← Back to projects
          </Link>

          <div className="mt-6 rounded-2xl border border-dashed border-border-light bg-glass-bg p-12 text-center">
            <h1 className="text-base font-semibold text-text">
              Project not found
            </h1>

            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              This project may have been deleted.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
        <Link
          href={`/projects/${project.id}/tasks`}
          className="
            text-sm font-semibold text-accent
            transition hover:text-accent-hover hover:underline
            underline-offset-4
          "
        >
          ← Back to tasks
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {project.name}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            New Task
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Add a task to this project.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl">
          <TaskForm
            action={(values) => addTask(project.id, values)}
            redirectTo={`/projects/${project.id}/tasks`}
            submitLabel="Create task"
          />
        </section>
      </div>
    </main>
  );
}