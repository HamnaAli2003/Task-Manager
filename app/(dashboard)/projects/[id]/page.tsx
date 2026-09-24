"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/dataStore";
import ProjectDeleteButton from "@/components/dashboard/ProjectDeleteButton";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const project = useDataStore((state) =>
    state.projects.find((item) => item.id === id)
  );
  const tasks = useDataStore((state) => state.tasks);
  const hydrated = useDataStore((state) => state._hasHydrated);
  const trackProjectOpen = useDataStore((state) => state.trackProjectOpen);

  useEffect(() => {
    if (hydrated && project) {
      trackProjectOpen(project.id);
    }
  }, [hydrated, project, trackProjectOpen]);

  if (hydrated && !project) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
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

  const projectTasks = project
    ? tasks.filter((task) => task.projectId === project.id)
    : [];
  const doneCount = projectTasks.filter((task) => task.status === "done").length;
  const progress =
    projectTasks.length > 0
      ? Math.round((doneCount / projectTasks.length) * 100)
      : project?.progress ?? 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
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

        {project && (
          <>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Project
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {project.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="
                      rounded-xl border border-border-light bg-clay-bg
                      px-4 py-2 text-sm font-semibold text-text-secondary
                      shadow-sm transition hover:border-black hover:text-black
                    "
                  >
                    Edit project
                  </Link>

                  <ProjectDeleteButton projectName={project.name} />
                </div>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                {project.description}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary">
                {projectTasks.length} tasks
              </span>

              <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary">
                {projectTasks.length - doneCount} open
              </span>

              <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary">
                {doneCount} done
              </span>

              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {progress}% complete
              </span>
            </div>

            <div className="mt-4 h-2 max-w-2xl overflow-hidden rounded-full bg-border-light">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <section className="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_0.75fr]">
              <Link
                href={`/projects/${project.id}/tasks`}
                className="
                  group rounded-2xl border border-glass-border
                  bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl
                  transition duration-200 hover:-translate-y-0.5
                "
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Task management
                </p>

                <h2 className="mt-2 text-lg font-bold text-text">
                  View and manage tasks
                </h2>

                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Search, filter by status and priority, create and edit tasks
                  for this project.
                </p>

                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition group-hover:gap-2">
                  Open tasks <span aria-hidden="true">→</span>
                </span>
              </Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
}