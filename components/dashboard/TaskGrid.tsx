"use client";

import { useSearchParams } from "next/navigation";
import type { Task } from "@/lib/data";
import { isTaskPriority, isTaskStatus } from "@/lib/taskOptions";
import { useDataStore, useStoreData } from "@/lib/dataStore";
import TaskCard from "./TaskCard";
import TaskFilterBar from "./TaskFilterBar";

type TaskGridProps = {
  serverTasks: Task[];
  projectId?: string;
  showProjectName?: boolean;
};

export default function TaskGrid({
  serverTasks,
  projectId,
  showProjectName = false,
}: TaskGridProps) {
  const searchParams = useSearchParams();
  const tasks = useStoreData(serverTasks, (state) => state.tasks);
  const projects = useStoreData([], (state) => state.projects);
  const deleteTask = useDataStore((state) => state.deleteTask);

  const projectNames = new Map(
    projects.map((project) => [project.id, project.name])
  );

  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const statusRaw = searchParams.get("status") ?? "";
  const priorityRaw = searchParams.get("priority") ?? "";
  const status = isTaskStatus(statusRaw) ? statusRaw : "";
  const priority = isTaskPriority(priorityRaw) ? priorityRaw : "";

  const hasFilters = Boolean(status || priority || search);

  const visible = tasks
    .filter((task) => !projectId || task.projectId === projectId)
    .filter((task) => !status || task.status === status)
    .filter((task) => !priority || task.priority === priority)
    .filter(
      (task) =>
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)
    )
    .filter(
      (task, index, list) => list.findIndex((item) => item.id === task.id) === index
    );

  return (
    <div>
      <div className="mt-6">
        <TaskFilterBar />
      </div>

      <p className="mt-3 text-sm text-text-secondary">
        {visible.length} {visible.length === 1 ? "task" : "tasks"}{" "}
        {hasFilters
          ? "match your filters"
          : projectId
            ? "in this project"
            : "across all projects"}
        .
      </p>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectName={
              showProjectName ? projectNames.get(task.projectId) : undefined
            }
            deleteAction={deleteTask}
          />
        ))}
      </section>

      {visible.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border-light bg-glass-bg p-12 text-center">
          <p className="text-3xl">◎</p>

          <h2 className="mt-3 text-base font-semibold text-text">
            No tasks found
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            {hasFilters
              ? "Try adjusting your search or clearing the filters."
              : "Create a task from the project pages."}
          </p>
        </div>
      )}
    </div>
  );
}