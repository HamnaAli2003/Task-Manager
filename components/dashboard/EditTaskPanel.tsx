"use client";

import type { Task } from "@/lib/data";
import { useDataStore } from "@/lib/dataStore";
import TaskForm from "./TaskForm";

type EditTaskPanelProps = {
  task: Task;
  projectId: string;
  redirectTo: string;
  requiresAssignee: boolean;
  canChangeStatus: boolean;
  canEditDetails: boolean;
  canManageAssignees: boolean;
};

/** Renders the task edit form with the server-resolved field permissions.
 *  An assignee sees a read-only task with just the status control.
 */
export default function EditTaskPanel({
  task,
  projectId,
  redirectTo,
  requiresAssignee,
  canChangeStatus,
  canEditDetails,
  canManageAssignees,
}: EditTaskPanelProps) {
  const updateTask = useDataStore((state) => state.updateTask);

  return (
    <>
      <p className="mb-5 text-sm text-text-secondary">
        {canEditDetails
          ? "Update the details of this task."
          : "Move this task through its workflow."}
      </p>

      <TaskForm
        projectId={projectId}
        requiresAssignee={requiresAssignee}
        canChangeStatus={canChangeStatus}
        canEditDetails={canEditDetails}
        canManageAssignees={canManageAssignees}
        defaultValues={{
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due: task.due,
          // Carried through untouched when the picker is hidden, so a
          // status-only save never clears the assignees.
          assigneeIds: task.assignees.map((assignee) => assignee.id),
        }}
        action={(values) => updateTask(task.id, values)}
        redirectTo={redirectTo}
        submitLabel={canEditDetails ? "Save changes" : "Update status"}
      />
    </>
  );
}
