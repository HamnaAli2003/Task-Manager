"use client";

import { useEffect } from "react";
import { saveUser } from "@/components/dashboard/useUser";

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function UserSync({ user }: { user: SessionUser }) {
  useEffect(() => {
    saveUser({
      id: user.id ?? "",
      name: user.name ?? "User",
      email: user.email ?? "",
      image: user.image ?? null,
    });
  }, [user.id, user.name, user.email, user.image]);

  return null;
}
