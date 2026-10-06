"use server";

import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type ProfileResult = { error?: string };

/** Save name / bio / image for the signed-in user. */
export async function updateProfile(input: {
  name: string;
  bio?: string;
  image?: string | null;
}): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You are not signed in." };

  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      bio: input.bio?.trim() || null,
      image: input.image || null,
    },
  });

  return {};
}

/**
 * Link Google to the CURRENT signed-in account.
 * Guarded: must be signed in first. Forces Google's account chooser so the
 * user does not silently link the wrong (already-used) Google account.
 */
export async function connectGoogleAction(): Promise<void> {
  const session = await auth();

  // No session → nothing to link to. Send back to login with a reason.
  if (!session?.user?.id) {
    redirect("/login?error=SignInRequired");
  }

  await signIn(
    "google",
    { redirectTo: "/profile?linked=1" },
    { prompt: "select_account" } // always show "choose an account"
  );
}
