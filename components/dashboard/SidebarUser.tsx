"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/login/action";
import { useUser } from "./useUser";

export default function SidebarUser() {
    const router = useRouter();
    const user = useUser();

    const [busy, setBusy] = useState(false);

    const initials =
        user.name
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "G";

    const handleLogout = async () => {
        setBusy(true);
        await logout();
        router.push("/login");
    };

    return (
        <div className="space-y-3">
            <Link
                href="/profile"
                className="
                block w-full rounded-3xl border border-clay-edge
                bg-clay-bg p-3 shadow-(--clay-inset-high)
                transition hover:-translate-y-0.5 hover:shadow-(--clay-drop)
                dark:border-slate-700 dark:bg-slate-800
              "
            >
                <div className="flex items-center gap-3">
                    {/* Always initials — never the uploaded profile photo. */}
                    <div
                        className="
                      flex size-11 shrink-0
                      items-center justify-center
                      rounded-full
                      bg-accent
                      text-sm font-bold
                      text-white
                    "
                    >
                        {initials}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-sm font-semibold leading-none text-text dark:text-slate-100">
                            {user.name}
                        </p>

                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-text-muted dark:text-slate-400">
                            View profile
                        </p>
                    </div>
                </div>
            </Link>

            <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                aria-label="Log out"
                title="Log out"
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-2xl
                  border border-clay-edge
                  bg-clay-bg
                  px-3 py-2.5
                  text-sm font-semibold
                  text-text-secondary
                  shadow-(--clay-drop)
                  transition
                  hover:-translate-y-0.5
                  hover:text-danger
                  dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-danger
                "
            >
                <svg
                    viewBox="0 0 24 24"
                    className="size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>

                {busy ? "Logging out..." : "Log out"}
            </button>
        </div>
    );
}