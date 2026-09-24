"use client";

import Link from "next/link";
import NewTaskForm from "@/components/dashboard/NewTaskForm";
import { useDataStore } from "@/lib/dataStore";

export default function NewTaskPage() {
  const projects = useDataStore((state) => state.projects);
  const addTask = useDataStore((state) => state.addTask);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
        <Link
          href="/tasks"
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
            New Task
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Create a task
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Pick a project and fill in the task details.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl">
          <NewTaskForm
            projects={projects}
            action={addTask}
            submitLabel="Create task"
          />
        </section>
      </div>
    </main>
  );
}