import type { TaskPriority, TaskStatus } from "./taskOptions";

export type Project = {
  id: string;
  name: string;
  description: string;
  progress: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
};

// NOTE: sirf UI display ke liye (task cards pe assignee). M2 mein
// yeh asli WorkspaceMember rows se replace hoga.
export const TEAM_MEMBERS: TeamMember[] = [
  { id: "u1", name: "Ayesha Khan", role: "Product Lead", initials: "AK", color: "bg-accent" },
  { id: "u2", name: "Tania Rao", role: "Frontend Engineer", initials: "TR", color: "bg-info" },
  { id: "u3", name: "Sana Khan", role: "Designer", initials: "SK", color: "bg-success" },
  { id: "u4", name: "Maya Chen", role: "Backend Engineer", initials: "MC", color: "bg-warning" },
  { id: "u5", name: "Laiba Osman", role: "QA Engineer", initials: "LO", color: "bg-danger" },
];

export const CURRENT_USER_ID = TEAM_MEMBERS[0].id;

export const TEAM_MEMBERS_BY_ID = new Map(
  TEAM_MEMBERS.map((member) => [member.id, member])
);

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due: string;
  assigneeId?: string;
  createdBy?: string;
};

export type TaskFilters = {
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  search?: string;
};

export type TaskInput = Omit<Task, "id" | "projectId">;

export type ProjectInput = Pick<Project, "name" | "description"> & {
  progress?: number;
};

export type ProjectStats = {
  taskCount: number;
  openCount: number;
  doneCount: number;
  progress: number;
};
