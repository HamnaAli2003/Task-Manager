import { prisma } from "@/lib/prisma";

/** Logs a workspace activity event for history/history pages. */
export async function logActivityEvent(input: {
  workspaceId: string;
  category: string;
  type: string;
  actorName?: string | null;
  targetName?: string | null;
  message: string;
  createdAt?: Date;
}) {
  return prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      category: input.category,
      type: input.type,
      actorName: input.actorName ?? null,
      targetName: input.targetName ?? null,
      message: input.message,
      createdAt: input.createdAt ?? new Date(),
    },
  });
}

/** ALL activity for ONE workspace (every category), newest first. */
export async function listWorkspaceActivity(
  workspaceId: string,
  limit = 50,
  userId?: string,
) {
  return prisma.activityEvent.findMany({
    where: {
      workspaceId,
      ...(userId ? { dismissals: { none: { userId } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Member-only activity for the members history panel. */
export async function listMemberActivity(
  workspaceId: string,
  userId?: string,
  limit = 50,
) {
  return prisma.activityEvent.findMany({
    where: {
      workspaceId,
      category: "MEMBER",
      ...(userId ? { dismissals: { none: { userId } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
