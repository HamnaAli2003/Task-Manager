"use client";

import Link from "next/link";
import { useUser } from "./useUser";

export default function SidebarUser() {
    const user = useUser();

    const initials =
        user.name
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "G";

    return (
        <div>
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

        </div>
    );
}