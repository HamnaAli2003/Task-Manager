"use client";

import { useState } from "react";
import type { Project } from "@/lib/data";
import type { TaskActionResult, TaskFormOutput } from "@/lib/schemas";
import ClaySelect from "./ClaySelect";
import TaskForm from "./TaskForm";

type NewTaskFormProps = {
  projects: Project[];
  action: (projectId: string, values: TaskFormOutput) => Promise<TaskActionResult>;
  submitLabel: string;
};

export default function NewTaskForm({
  projects,
  action,
  submitLabel,
}: NewTaskFormProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="task-project"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Project
        </label>

        <ClaySelect
          value={projectId}
          onChange={setProjectId}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          ariaLabel="Project"
        />
      </div>

      <TaskForm
        action={(values) => action(projectId, values)}
        redirectTo={`/projects/${projectId}/tasks`}
        submitLabel={submitLabel}
      />
    </div>
  );
}