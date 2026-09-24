"use client";

import Link from "next/link";
import { useUser } from "./useUser";

export default function DashboardHeader() {
    const user = useUser();
    const firstName = (user.name.split(" ")[0] || "there").trim();

    return (
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
                    Workspace overview
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    Good to see you, {firstName}
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Here&apos;s what&apos;s moving across your workspace.
                </p>
            </div>

            <Link
                href="/projects/new"
                className="
          inline-flex w-fit items-center gap-2
          rounded-2xl
          bg-accent
          px-4 py-2.5
          text-sm font-semibold text-white
          shadow-(--clay-drop)
          transition
          hover:-translate-y-0.5
          hover:brightness-105
        "
            >
                <span className="text-lg leading-none">+</span>
                New Project
            </Link>
        </div>
    );
}