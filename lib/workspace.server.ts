// Workspace helpers (Milestone 2, Stage 4).
// The active workspace is remembered in an httpOnly cookie ("pmp-workspace").
// The cookie is only a hint — membership is always verified against the DB.
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const WORKSPACE_COOKIE = "pmp-workspace";

/** Returns the logged-in user from the session, or null. */
export async function getCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

/** Same as getCurrentUser but redirects to /login when there is no session. */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Guarantees the user has exactly ONE PERSONAL workspace.
 * The PERSONAL workspace is the per-user default/fallback — switching to it
 * is how the app ejects users after a workspace is deleted.
 * Race-safe: two parallel requests (layout + page on first load) could
 * both pass the "no personal workspace" check and create two workspaces.
 * The Postgres advisory lock ensures only one of them creates it.
 */
export async function ensurePersonalWorkspace(userId: string) {
  // Fast path: a PERSONAL workspace already exists -> return it.
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId, workspace: { type: "PERSONAL" } },
    include: { workspace: true },
  });

  if (existingMembership) {
    return existingMembership.workspace;
  }

  // Slow path (first ever load, or the old personal was deleted):
  // create under a per-user lock.
  return prisma.$transaction(async (tx) => {
    // Advisory lock: parallel requests for the same user queue up here.
    // $executeRaw (not $queryRaw) because pg_advisory_xact_lock returns a
    // void column, which $queryRaw cannot deserialize.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    // Re-check INSIDE the lock — the other request may have just created it.
    const membership = await tx.workspaceMember.findFirst({
      where: { userId, workspace: { type: "PERSONAL" } },
      include: { workspace: true },
    });

    if (membership) {
      return membership.workspace;
    }

    return tx.workspace.create({
      data: {
        name: "Personal Workspace",
        type: "PERSONAL",
        ownerId: userId,
        members: {
          // nested create = workspace + OWNER membership in one query
          create: { userId, role: "OWNER" },
        },
      },
    });
  });
}

/** All workspaces the user belongs to, oldest first (for the switcher). */
export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map(({ workspace, role }) => {
    const { _count, ...rest } = workspace;
    const workspaceWithLogo = workspace as typeof workspace & {
      logoUrl?: string | null;
    };

    return {
      ...rest,
      type: workspace.type,
      logoUrl: workspaceWithLogo.logoUrl ?? null,
      memberCount: _count.members,
      role,
    };
  });
}

/**
 * Active workspace = the one chosen in the switcher (cookie),
 * falling back to the user's first workspace.
 * A stale cookie (deleted workspace / not a member) is ignored safely.
 */
export async function getActiveWorkspace() {
  const user = await requireUser();
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (workspaceId) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
      include: { workspace: true },
    });

    // Only trust the cookie if this user is really a member.
    if (membership?.workspace) {
      return membership.workspace;
    }
  }

  // Cookie missing, stale, or unauthorized -> first workspace.
  return ensurePersonalWorkspace(user.id);
}

/** Security gate: redirect unless the user is a member of this workspace. */
export async function requireWorkspaceMember(workspaceId: string) {
  const user = await requireUser();

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: user.id },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  return membership;
}