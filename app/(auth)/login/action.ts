"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AuthResult = { error?: string };

export type EmailCheck = {
  available: boolean;
};

export async function checkEmail(email: string): Promise<EmailCheck> {
  const clean = email.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  if (!clean || !valid) return { available: false };

  const user = await prisma.user.findUnique({
    where: { email: clean },
    select: { id: true },
  });

  return { available: !user };
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const session = await auth();
  if (session?.user) return { error: "You are already logged in." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      const existing = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true },
      });
      if (!existing) return { error: "This email is not registered." };
      return { error: "Incorrect email or password." };
    }
    throw error;
  }
}

export async function loginWithGoogle(): Promise<AuthResult> {
  const session = await auth();
  if (session?.user)
    return {
      error:
        "You are already signed in with Google. You can't create a new account or sign in again until you log out.",
    };

  return {};
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();

  const session = await auth();
  if (session?.user) return { error: "You are already logged in." };

  if (!cleanName || !cleanEmail.includes("@") || password.length < 6) {
    return { error: "Please complete all fields correctly." };
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return { error: "An account with this email already exists." };

  await prisma.user.create({
    data: { name: cleanName, email: cleanEmail, passwordHash: await bcrypt.hash(password, 12) },
  });

  await signIn("credentials", { email: cleanEmail, password, redirectTo: "/dashboard" });
  return {};
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function deleteAccount(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  // Delete workspaces this user owns first (members + projects cascade with it).
  await prisma.workspace.deleteMany({ where: { ownerId: session.user.id } });

  // Now the user (Account + Session rows cascade-delete with it).
  await prisma.user.delete({ where: { id: session.user.id } });

  await signOut({ redirectTo: "/login" });
  return {};
}

