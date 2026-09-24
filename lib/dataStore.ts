"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Project, Task } from "@/lib/data";
import type {
  ProjectActionResult,
  ProjectFormOutput,
  TaskActionResult,
  TaskFormOutput,
} from "@/lib/schemas";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/app/(dashboard)/projects/actions";
import {
  createTaskAction,
  deleteTaskAction,
  markTaskDoneAction,
  updateTaskAction,
} from "@/app/(dashboard)/projects/[id]/tasks/actions";

export type ActivityType =
  | "task-created"
  | "task-updated"
  | "task-deleted"
  | "task-done"
  | "project-created"
  | "project-updated"
  | "project-deleted";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  detail: string;
  projectId?: string;
  at: string;
};

type DataState = {
  projects: Project[];
  tasks: Task[];
  activities: ActivityEntry[];
  recentProjectIds: string[];
  _hasHydrated: boolean;
  addTask: (projectId: string, values: TaskFormOutput) => Promise<TaskActionResult>;
  updateTask: (taskId: string, values: TaskFormOutput) => Promise<TaskActionResult>;
  deleteTask: (taskId: string) => Promise<TaskActionResult>;
  markTaskDone: (taskId: string) => Promise<TaskActionResult>;
  addProject: (values: ProjectFormOutput) => Promise<ProjectActionResult>;
  updateProject: (projectId: string, values: ProjectFormOutput) => Promise<ProjectActionResult>;
  deleteProject: (projectId: string) => Promise<ProjectActionResult>;
  trackProjectOpen: (projectId: string) => void;
  setProjects: (projects: Project[], tasks: Task[]) => void;
  setHasHydrated: (hydrated: boolean) => void;
  reset: () => void;
};

export function activityLabel(type: ActivityType): string {
  switch (type) {
    case "task-created":
      return "Created task";
    case "task-updated":
      return "Updated task";
    case "task-deleted":
      return "Deleted task";
    case "task-done":
      return "Completed task";
    case "project-created":
      return "Created project";
    case "project-updated":
      return "Updated project";
    case "project-deleted":
      return "Deleted project";
  }
}

function makeEntry(
  type: ActivityType,
  detail: string,
  projectId?: string
): ActivityEntry {
  return {
    id: `${type}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    type,
    detail,
    projectId,
    at: new Date().toISOString(),
  };
}

function recordActivity(
  state: DataState,
  type: ActivityType,
  detail: string,
  projectId?: string
): Pick<DataState, "activities"> {
  return {
    activities: [makeEntry(type, detail, projectId), ...state.activities].slice(0, 50),
  };
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],
      activities: [],
      recentProjectIds: [],
      _hasHydrated: false,

      addTask: async (projectId, values) => {
        const result = await createTaskAction(projectId, values);
        const created = result.task;

        if (!result.ok || !created) {
          return { ok: false, error: result.error ?? "Could not create task." };
        }

        set((state) => ({
          tasks: [created, ...state.tasks.filter((item) => item.id !== created.id)],
          ...recordActivity(state, "task-created", values.title, projectId),
        }));

        return result;
      },

      updateTask: async (taskId, values) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { ok: false, error: "Task not found." };

        const result = await updateTaskAction(task.projectId, taskId, values);
        if (!result.ok) {
          return { ok: false, error: result.error ?? "Could not update task." };
        }

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId ? { ...item, ...values } : item
          ),
          ...recordActivity(state, "task-updated", values.title, task.projectId),
        }));

        return result;
      },

      deleteTask: async (taskId) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { ok: false, error: "Task not found." };

        const result = await deleteTaskAction(task.projectId, taskId);
        if (!result.ok) {
          return { ok: false, error: result.error ?? "Could not delete task." };
        }

        set((state) => ({
          tasks: state.tasks.filter((item) => item.id !== taskId),
          ...recordActivity(state, "task-deleted", task.title, task.projectId),
        }));

        return result;
      },

      markTaskDone: async (taskId) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task) return { ok: false, error: "Task not found." };

        const result = await markTaskDoneAction(task.projectId, taskId);
        if (!result.ok) {
          return { ok: false, error: result.error ?? "Could not complete task." };
        }

        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId ? { ...item, status: "done" } : item
          ),
          ...recordActivity(state, "task-done", task.title, task.projectId),
        }));

        return result;
      },

      addProject: async (values) => {
        const result = await createProjectAction({
          name: values.name,
          description: values.description,
          progress: values.progress,
        });
        const created = result.project;

        if (!result.ok || !created) {
          return { ok: false, error: result.error ?? "Could not create project." };
        }

        set((state) => ({
          projects: [
            created,
            ...state.projects.filter((item) => item.id !== created.id),
          ],
          ...recordActivity(state, "project-created", values.name),
        }));

        return result;
      },

      updateProject: async (projectId, values) => {
        const result = await updateProjectAction(projectId, {
          name: values.name,
          description: values.description,
          progress: values.progress,
        });
        const updated = result.project;

        if (!result.ok || !updated) {
          return { ok: false, error: result.error ?? "Could not update project." };
        }

        set((state) => ({
          projects: state.projects.map((item) =>
            item.id === projectId ? updated : item
          ),
          ...recordActivity(state, "project-updated", values.name, projectId),
        }));

        return result;
      },

      deleteProject: async (projectId) => {
        const project = get().projects.find((item) => item.id === projectId);

        const result = await deleteProjectAction(projectId);
        if (!result.ok) {
          return { ok: false, error: result.error ?? "Could not delete project." };
        }

        set((state) => ({
          projects: state.projects.filter((item) => item.id !== projectId),
          tasks: state.tasks.filter((item) => item.projectId !== projectId),
          recentProjectIds: state.recentProjectIds.filter((id) => id !== projectId),
          ...recordActivity(state, "project-deleted", project?.name ?? "project", projectId),
        }));

        return result;
      },
      reset: () => set({ activities: [], recentProjectIds: [] }),

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      trackProjectOpen: (projectId) =>
        set((state) => ({
          recentProjectIds: [
            projectId,
            ...state.recentProjectIds.filter((id) => id !== projectId),
          ].slice(0, 5),
        })),

      setProjects: (projects, tasks) => set({ projects, tasks }),
    }),
    {
      name: "projectflow-v2",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted) => {
        const p = persisted as {
          activities?: ActivityEntry[];
          recentProjectIds?: string[];
        };
        return {
          activities: Array.isArray(p.activities) ? p.activities : [],
          recentProjectIds: Array.isArray(p.recentProjectIds)
            ? p.recentProjectIds
            : [],
        } as DataState;
      },

      partialize: (state) => ({
        activities: state.activities,
        recentProjectIds: state.recentProjectIds,
      }),
      onRehydrateStorage: () => (state) => {
        const target = state ?? useDataStore.getState();
        target.setHasHydrated(true);
      },
    }
  )
);

export function useHasHydrated(): boolean {
  return useDataStore((state) => state._hasHydrated);
}

export function useStoreData<T>(
  serverValue: T,
  selector: (state: DataState) => T
): T {
  const hydrated = useHasHydrated();
  const storeValue = useDataStore(selector);

  return hydrated ? storeValue : serverValue;
}
