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
};

export default function ProjectsGrid({
  serverProjects,
  maxColumns = 3,
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

  return (
    <section
      className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${maxColumns === 3 ? "xl:grid-cols-3" : ""}`}
    >
      {cards.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className={`group flex h-full flex-col rounded-2xl border border-border-light p-5 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl ${project.cardClass}`}
        >
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
            <span className="text-text-muted">{project.taskCount} tasks</span>

            <span className="font-semibold text-accent">{project.progress}%</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-light">
            <div
              className={`h-full rounded-full ${project.color}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </Link>
      ))}
    </section>
  );
}