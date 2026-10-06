"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { isEmailTaken, createUser, deleteUserAndOwnedWorkspaces } from "@/lib/auth.service";

export type AuthResult = { error?: string };

/** Signup form: is this email free? (convenience only — signup re-checks) */
export async function checkEmail(email: string): Promise<{ available: boolean }> {
  const clean = email.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  if (!valid) return { available: false };

  return { available: !(await isEmailTaken(clean)) };
}

/** Email + password login. */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  if ((await auth())?.user) return { error: "You are already logged in." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      const taken = await isEmailTaken(email);
      return {
        error: taken
          ? "Incorrect email or password."
          : "This email is not registered.",
      };
    }
    throw error;
  }
}

/** Google sign-in from the login page. */
export async function loginWithGoogle(): Promise<AuthResult> {
  if ((await auth())?.user) {
    return { error: "You are already signed in. Please log out first." };
  }
  return {};
}

/** Create account, then log in. */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();

  if ((await auth())?.user) return { error: "You are already logged in." };

  if (!cleanName || !cleanEmail.includes("@") || password.length < 6) {
    return { error: "Please complete all fields correctly." };
  }

  const created = await createUser(cleanName, cleanEmail, password);
  if (!created.ok) return { error: created.error };

  await signIn("credentials", {
    email: cleanEmail,
    password,
    redirectTo: "/dashboard",
  });
  return {};
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/** Delete account + owned workspaces, then log out. */
export async function deleteAccount(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  await deleteUserAndOwnedWorkspaces(session.user.id);
  await signOut({ redirectTo: "/login" });
  return {};
}
