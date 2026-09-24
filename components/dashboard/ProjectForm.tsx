"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectSchema,
  type ProjectActionResult,
  type ProjectFormInput,
  type ProjectFormOutput,
} from "@/lib/schemas";

type ProjectFormProps = {
  action: (values: ProjectFormOutput) => Promise<ProjectActionResult>;
  redirectTo: string;
  submitLabel: string;
  defaultValues?: Partial<ProjectFormOutput>;
  busyLabel?: string;
};

const inputClass = `
  w-full rounded-xl border border-clay-edge bg-clay-bg
  px-4 py-2.5 text-sm text-text
  placeholder:text-text-muted
  outline-none transition focus:border-accent
`;

export default function ProjectForm({
  action,
  redirectTo,
  submitLabel,
  defaultValues,
  busyLabel = "Creating…",
}: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, undefined, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      progress: 0,
      ...defaultValues,
    },
  });

  async function onSubmit(values: ProjectFormOutput) {
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
          htmlFor="project-name"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Project name
        </label>

        <input
          id="project-name"
          type="text"
          placeholder="e.g. Marketing Site Refresh"
          aria-invalid={errors.name ? "true" : undefined}
          {...register("name")}
          className={`${inputClass} ${
            errors.name ? "border-danger" : ""
          }`}
        />

        {errors.name && (
          <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="project-description"
          className="mb-1.5 block text-sm font-medium text-text"
        >
          Description
        </label>

        <textarea
          id="project-description"
          rows={4}
          placeholder="What is this project about?"
          {...register("description")}
          className={inputClass}
        />

        {errors.description && (
          <p className="mt-1.5 text-xs text-danger">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="project-progress"
          className="mb-1.5 flex items-center justify-between text-sm font-medium text-text"
        >
          <span>Starting progress</span>
          <span className="text-xs font-normal text-text-muted">0–100%</span>
        </label>

        <input
          id="project-progress"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={5}
          {...register("progress", { valueAsNumber: true })}
          className={inputClass}
        />

        {errors.progress && (
          <p className="mt-1.5 text-xs text-danger">
            {errors.progress.message}
          </p>
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
        {isSubmitting ? busyLabel : submitLabel}
      </button>
    </form>
  );
}