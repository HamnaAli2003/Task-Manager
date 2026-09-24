// Seed script: restores the original sample data (4 projects + 8 tasks)
// inside a dedicated "Default Workspace".
// Run with: npx tsx prisma/seed.ts  (safe to re-run — uses upserts)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_WORKSPACE_ID = "default-workspace";
const SEED_OWNER_EMAIL = "owner@project-portal.local";

function isoDate(daysFromNow: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

const PROJECTS = [
  {
    id: "1",
    name: "Internal Admin Dashboard",
    description:
      "Ops tooling for support and billing teams with role-based views.",
    progress: 81,
  },
  {
    id: "2",
    name: "Mobile Banking App",
    description:
      "Native-like mobile experience for personal banking workflows.",
    progress: 42,
  },
  {
    id: "3",
    name: "Design System Library",
    description:
      "Shared component library with tokens and documentation.",
    progress: 74,
  },
  {
    id: "4",
    name: "Mobile App Onboarding",
    description:
      "First-run experience with progressive profiling.",
    progress: 49,
  },
];

const TASKS = [
  {
    id: "task-csv-export",
    projectId: "1",
    title: "CSV bulk export",
    description: "Export filtered table data with a column selector.",
    status: "done",
    priority: "medium",
    due: isoDate(2),
    assigneeId: "u3",
    createdBy: "u1",
  },
  {
    id: "task-role-permissions",
    projectId: "1",
    title: "Role-based permissions mapping",
    description: "Map roles to project and task scopes.",
    status: "in-progress",
    priority: "high",
    due: isoDate(3),
    assigneeId: "u4",
    createdBy: "u2",
  },
  {
    id: "task-recurring-transfer",
    projectId: "2",
    title: "Recurring transfer scheduling",
    description: "Weekly / monthly frequency picker and confirmation flow.",
    status: "in-progress",
    priority: "urgent",
    due: isoDate(1),
    assigneeId: "u1",
    createdBy: "u3",
  },
  {
    id: "task-auth-ui",
    projectId: "2",
    title: "Build authentication UI",
    description: "Role-based login and signup flows.",
    status: "todo",
    priority: "high",
    due: isoDate(5),
    assigneeId: "u2",
    createdBy: "u4",
  },
  {
    id: "task-design-tokens",
    projectId: "3",
    title: "Complete design tokens",
    description: "Glass and clay variants with theme support.",
    status: "review",
    priority: "low",
    due: isoDate(4),
    assigneeId: "u4",
    createdBy: "u5",
  },
  {
    id: "task-storybook",
    projectId: "3",
    title: "Storybook coverage for cards",
    description: "Stories for card variants in light and dark mode.",
    status: "todo",
    priority: "medium",
    due: isoDate(7),
    assigneeId: "u5",
    createdBy: "u1",
  },
  {
    id: "task-onboarding-flow",
    projectId: "4",
    title: "First-run onboarding flow",
    description: "Welcome screens and progressive profiling.",
    status: "in-progress",
    priority: "medium",
    due: isoDate(6),
    assigneeId: "u1",
    createdBy: "u2",
  },
  {
    id: "task-progressive-profiling",
    projectId: "4",
    title: "Progressive profiling questionnaire",
    description: "Multi-step questionnaire with smart defaults.",
    status: "todo",
    priority: "low",
    due: isoDate(9),
    assigneeId: "u2",
    createdBy: "u3",
  },
];

async function main() {
  // 1. Seed owner user (owns the default workspace)
  const owner = await prisma.user.upsert({
    where: { email: SEED_OWNER_EMAIL },
    update: {},
    create: {
      email: SEED_OWNER_EMAIL,
      name: "Workspace Owner",
    },
  });

  // 2. Default workspace + OWNER membership for the owner
  await prisma.workspace.upsert({
    where: { id: DEFAULT_WORKSPACE_ID },
    update: {},
    create: {
      id: DEFAULT_WORKSPACE_ID,
      name: "Default Workspace",
      ownerId: owner.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: DEFAULT_WORKSPACE_ID,
        userId: owner.id,
      },
    },
    update: {},
    create: {
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: owner.id,
      role: "OWNER",
    },
  });

  // 3. Projects — created INSIDE the default workspace (workspaceId now required)
  for (const p of PROJECTS) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: p,
      create: { ...p, workspaceId: DEFAULT_WORKSPACE_ID },
    });
  }

  // 4. Tasks
  for (const t of TASKS) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  console.log("Seeded ✓ (4 projects, 8 tasks in Default Workspace)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
