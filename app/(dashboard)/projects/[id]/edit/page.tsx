"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ProjectForm from "@/components/dashboard/ProjectForm";
import { useDataStore } from "@/lib/dataStore";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const project = useDataStore((state) =>
    state.projects.find((item) => item.id === id)
  );
  const updateProject = useDataStore((state) => state.updateProject);

  if (!project) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
          <p className="text-sm text-text-secondary">
            Project not found.{" "}
            <Link
              href="/projects"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Back to projects
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
        <Link
          href={`/projects/${project.id}`}
          className="
            text-sm font-semibold text-accent
            transition hover:text-accent-hover hover:underline
            underline-offset-4
          "
        >
          ← Back to project
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Edit project
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Edit &quot;{project.name}&quot;
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Update the details of this project.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl">
          <ProjectForm
            action={(values) => updateProject(project.id, values)}
            redirectTo={`/projects/${project.id}`}
            submitLabel="Save changes"
            busyLabel="Saving…"
            defaultValues={{
              name: project.name,
              description: project.description,
              progress: project.progress,
            }}
          />
        </section>
      </div>
    </main>
  );
}