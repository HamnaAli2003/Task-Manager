"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ClaySelect from "./ClaySelect";
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
  defaultValues?: Partial<TaskFormInput>;
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

export default function TaskForm({
  defaultValues,
  action,
  redirectTo,
  submitLabel,
}: TaskFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      ...defaultValues,
    },
  });

  async function onSubmit(values: TaskFormOutput) {
    setServerError(null);

    const result = await action(values);

    if (result.ok) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setServerError(result.error ?? "Something went wrong. Please try again.");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div>
        <label
          htmlFor="task-title"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Title
        </label>

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
      </div>

      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Description
        </label>

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
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="task-status"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Status
          </label>

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
        </div>

        <div>
          <label
            htmlFor="task-priority"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Priority
          </label>

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
        </div>
      </div>

      <div>
        <label
          htmlFor="task-due"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Due date
        </label>

        <input
          id="task-due"
          type="date"
          {...register("due")}
          className={fieldClass(Boolean(errors.due))}
        />

        {errors.due && (
          <p className="mt-1.5 text-xs text-danger">{errors.due.message}</p>
        )}
      </div>

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