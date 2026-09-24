import { z } from "zod";
import type { TaskPriority, TaskStatus } from "./taskOptions";

export const taskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z.string().max(500, "Description is too long").default(""),
  status: z.enum(
    ["todo", "in-progress", "review", "done"] as [
      TaskStatus,
      ...TaskStatus[],
    ]
  ),
  priority: z.enum(
    ["low", "medium", "high", "urgent"] as [
      TaskPriority,
      ...TaskPriority[],
    ]
  ),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid due date"),
});

export type TaskFormInput = z.input<typeof taskSchema>;

export type TaskFormOutput = z.output<typeof taskSchema>;

export type TaskActionResult = {
  ok: boolean;
  error?: string;
};

export const projectSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name must be 120 characters or fewer"),
  description: z.string().max(500, "Description is too long").default(""),
  progress: z.coerce
    .number()
    .int("Use a whole number")
    .min(0, "Progress cannot be below 0")
    .max(100, "Progress cannot exceed 100")
    .optional()
    .default(0),
});

export type ProjectFormInput = z.input<typeof projectSchema>;

export type ProjectFormOutput = z.output<typeof projectSchema>;

export type ProjectActionResult = {
  ok: boolean;
  error?: string;
};