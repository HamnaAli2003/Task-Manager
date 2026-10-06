// All auth data + password work lives here. Internal helper only —
// imported by auth.ts and the auth actions, never by client code.

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

// Safe fields only. passwordHash is never part of this type.
export type SafeUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Check email + password. Returns the user, or null on failure. */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, name: true, email: true, image: true, passwordHash: true },
  });

  // No user, or a Google-only account (no password set).
  if (!user?.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

/** Does this email already have an account? */
export async function isEmailTaken(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });
  return Boolean(user);
}

/** Fresh profile for the session callback (so edits show immediately). */
export function getUserById(id: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, image: true },
  });
}

/** Create an email + password user. Returns a result, never throws. */
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizeEmail(email),
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
    });
    return { ok: true };
  } catch {
    // Unique-email race: two signups at once.
    return { ok: false, error: "An account with this email already exists." };
  }
}

/** Delete a user and the workspaces they own. */
export async function deleteUserAndOwnedWorkspaces(userId: string): Promise<void> {
  await prisma.workspace.deleteMany({ where: { ownerId: userId } });
  await prisma.user.delete({ where: { id: userId } });
}
