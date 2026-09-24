"use client";

import Link from "next/link";
import ProjectForm from "@/components/dashboard/ProjectForm";
import { useDataStore } from "@/lib/dataStore";

export default function NewProjectPage() {
  const addProject = useDataStore((state) => state.addProject);

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

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            New project
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Create a project
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Add a new project to your workspace.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl">
          <ProjectForm
            action={addProject}
            redirectTo="/projects"
            submitLabel="Create project"
          />
        </section>
      </div>
    </main>
  );
}