"use client";

import Link from "next/link";
import type { Project } from "@/lib/data";
import { useDataStore, useStoreData } from "@/lib/dataStore";

const PALETTE = [
  { color: "bg-success", cardClass: "bg-success/15" },
  { color: "bg-info", cardClass: "bg-info/15" },
  { color: "bg-accent", cardClass: "bg-accent/15" },
  { color: "bg-warning", cardClass: "bg-warning/15" },
];

type ProjectsGridProps = {
  serverProjects: Project[];
  maxColumns?: 2 | 3;
  maxItems?: number;
  showMoreHref?: string;
  compact?: boolean;
};

export default function ProjectsGrid({
  serverProjects,
  maxColumns = 3,
  maxItems,
  showMoreHref,
  compact = false,
}: ProjectsGridProps) {
  const projects = useStoreData(serverProjects, (state) => state.projects);
  const tasks = useDataStore((state) => state.tasks);

  const cards = projects.map((project, index) => {
    const projectTasks = tasks.filter(
      (task) => task.projectId === project.id
    );
    const doneCount = projectTasks.filter(
      (task) => task.status === "done"
    ).length;

    return {
      ...project,
      taskCount: projectTasks.length,
      progress:
        projectTasks.length > 0
          ? Math.round((doneCount / projectTasks.length) * 100)
          : project.progress,
      ...PALETTE[index % PALETTE.length],
    };
  });
  const visibleCards = maxItems === undefined ? cards : cards.slice(0, maxItems);

  return (
    <div>
      <section
        className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${maxColumns === 3 ? "xl:grid-cols-3" : ""}`}
      >
        {visibleCards.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className={`group flex h-full flex-col rounded-2xl border border-border-light shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl ${compact ? "min-h-36 p-4" : "p-5"} ${project.cardClass}`}
          >
            {compact ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${project.color} text-sm font-bold text-white shadow-sm`}
                  >
                    ▣
                  </div>
                  <span className="ml-auto text-xs font-medium text-text-muted transition group-hover:text-accent">
                    View →
                  </span>
                </div>

                <h2 className="mt-3 truncate text-sm font-semibold text-text">
                  {project.name}
                </h2>

                <p className="mt-1 line-clamp-1 text-xs text-text-secondary">
                  {project.description || "Current phase"}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3 text-xs">
                  <span className="text-text-muted">
                    {project.taskCount} tasks
                  </span>
                  <span className="font-semibold text-accent">
                    {project.progress}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-light">
                  <div
                    className={`h-full rounded-full ${project.color}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${project.color} text-sm font-bold text-white shadow-sm`}
                  >
                    ▣
                  </div>

                  <span className="text-xs font-medium text-text-muted transition group-hover:text-accent">
                    View →
                  </span>
                </div>

                <h2 className="mt-5 text-base font-semibold text-text">
                  {project.name}
                </h2>

                <p className="mt-2 flex-1 text-sm leading-5 text-text-secondary">
                  {project.description}
                </p>

                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    {project.taskCount} tasks
                  </span>

                  <span className="font-semibold text-accent">
                    {project.progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-light">
                  <div
                    className={`h-full rounded-full ${project.color}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </>
            )}
          </Link>
        ))}
      </section>

      {showMoreHref && maxItems !== undefined && cards.length > maxItems && (
        <div className="mt-5 flex justify-center">
          <Link
            href={showMoreHref}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-(--clay-drop) transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Show more projects
          </Link>
        </div>
      )}
    </div>
  );
}