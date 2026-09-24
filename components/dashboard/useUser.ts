"use client";

import { useSyncExternalStore } from "react";

export type StoredUser = {
  name: string;
  email: string;
  image?: string | null;
};

const STORAGE_KEY = "pmp-user";

const DEFAULT_USER: StoredUser = {
  name: "Guest",
  email: "",
  image: null,
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useUser(): StoredUser {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!raw) return DEFAULT_USER;

  try {
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUser(user: StoredUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}