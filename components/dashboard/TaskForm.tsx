"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ClaySelect from "./ClaySelect";
import AssigneeSelect from "./AssigneeSelect";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/taskOptions";
import {
  taskSchema,
  type TaskActionResult,
  type TaskFormInput,
  type TaskFormOutput,
} from "@/lib/schemas";

type TaskFormProps = {
  projectId?: string; // assignee picker ke liye — na ho to section hidden
  defaultValues?: Partial<TaskFormInput>;
  canChangeStatus?: boolean;
  /** title, description, priority, due — owner-granted on edit */
  canEditDetails?: boolean;
  /** the assignee list — never delegated off the owner */
  canManageAssignees?: boolean;
  requiresAssignee?: boolean;
  action: (values: TaskFormOutput) => Promise<TaskActionResult>;
  redirectTo: string;
  submitLabel: string;
};

const inputClass = `
  w-full rounded-xl border border-clay-edge bg-clay-bg
  px-4 py-2.5 text-sm text-text
  placeholder:text-text-muted
  outline-none transition focus:border-accent
`;

const fieldClass = (hasError: boolean) =>
  hasError
    ? `${inputClass} border-danger`
    : inputClass;

const readOnlyClass = `
  rounded-xl border border-clay-edge bg-clay-bg
  px-4 py-2.5 text-sm text-text-secondary
`;

export default function TaskForm({
  projectId,
  defaultValues,
  canChangeStatus = true,
  canEditDetails = true,
  canManageAssignees = true,
  requiresAssignee = true,
  action,
  redirectTo,
  submitLabel,
}: TaskFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // Only the owner picks assignees, so only the owner is held to the
  // "at least one assignee" rule — an assignee would never see the picker.
  const mustPickAssignee = requiresAssignee && canManageAssignees;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput, undefined, TaskFormOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due: "",
      assigneeIds: [],
      ...defaultValues,
    },
  });

  async function onSubmit(values: TaskFormOutput) {
    setServerError(null);

    if (mustPickAssignee && values.assigneeIds.length === 0) {
      setServerError("Assign this task to at least one workspace member.");
      return;
    }

    const result = await action(values);

    if (result.ok) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setServerError(result.error ?? "Something went wrong. Please try again.");
  }

  const statusOnly = !canEditDetails;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {statusOnly && (
        <p className="rounded-xl border border-clay-edge bg-clay-bg px-4 py-3 text-xs text-text-secondary">
          You are assigned to this task, so you can change its status. Ask the
          workspace owner for access to edit the rest.
        </p>
      )}

      <div>
        <label
          htmlFor="task-title"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Title
        </label>

        {canEditDetails ? (
          <>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Implement search filters"
              aria-invalid={errors.title ? "true" : undefined}
              {...register("title")}
              className={fieldClass(Boolean(errors.title))}
            />

            {errors.title && (
              <p className="mt-1.5 text-xs text-danger">{errors.title.message}</p>
            )}
          </>
        ) : (
          <>
            <input type="hidden" {...register("title")} />
            <p className={readOnlyClass}>{defaultValues?.title}</p>
          </>
        )}
      </div>

      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Description
        </label>

        {canEditDetails ? (
          <>
            <textarea
              id="task-description"
              rows={4}
              placeholder="Optional details about the task…"
              {...register("description")}
              className={fieldClass(Boolean(errors.description))}
            />

            {errors.description && (
              <p className="mt-1.5 text-xs text-danger">
                {errors.description.message}
              </p>
            )}
          </>
        ) : (
          <>
            <input type="hidden" {...register("description")} />
            <p className={`${readOnlyClass} whitespace-pre-wrap`}>
              {defaultValues?.description || "No description."}
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="task-status"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Status
          </label>

          {canChangeStatus ? (
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <ClaySelect
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  options={TASK_STATUSES.map((value) => ({
                    value,
                    label: STATUS_LABELS[value],
                  }))}
                  ariaLabel="Status"
                  error={Boolean(errors.status)}
                />
              )}
            />
          ) : (
            <>
              <input type="hidden" {...register("status")} />
              <p className={readOnlyClass}>
                {STATUS_LABELS[defaultValues?.status ?? "todo"]} — only an
                assignee can change this
              </p>
            </>
          )}
        </div>

        <div>
          <label
            htmlFor="task-priority"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Priority
          </label>

          {canEditDetails ? (
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <ClaySelect
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  options={TASK_PRIORITIES.map((value) => ({
                    value,
                    label: PRIORITY_LABELS[value],
                  }))}
                  ariaLabel="Priority"
                  error={Boolean(errors.priority)}
                />
              )}
            />
          ) : (
            <>
              <input type="hidden" {...register("priority")} />
              <p className={readOnlyClass}>
                {PRIORITY_LABELS[defaultValues?.priority ?? "medium"]}
              </p>
            </>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="task-due"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Due date
        </label>

        {canEditDetails ? (
          <input
            id="task-due"
            type="date"
            {...register("due")}
            className={fieldClass(Boolean(errors.due))}
          />
        ) : (
          <>
            <input type="hidden" {...register("due")} />
            <p className={readOnlyClass}>{defaultValues?.due}</p>
          </>
        )}

        {errors.due && (
          <p className="mt-1.5 text-xs text-danger">{errors.due.message}</p>
        )}
      </div>

      {/* Multi-assignee picker — owner only, so an assignee never sees it.
          When it is hidden the assigneeIds field is left unregistered and
          keeps its defaultValues entry, so a status-only submit is not read
          as an attempt to strip the assignees. */}
      {projectId && requiresAssignee && canManageAssignees && (
        <Controller
          control={control}
          name="assigneeIds"
          render={({ field }) => (
            <AssigneeSelect
              projectId={projectId}
              value={field.value ?? []}
              onChange={(ids) => field.onChange(ids)}
              error={errors.assigneeIds?.message}
            />
          )}
        />
      )}

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full rounded-xl bg-accent py-2.5 text-sm font-semibold
          text-white shadow-(--clay-drop)
          transition hover:brightness-105
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
