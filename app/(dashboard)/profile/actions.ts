"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ProfileResult = { error?: string };

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