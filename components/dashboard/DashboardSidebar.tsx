"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Project } from "@/lib/data";
import { useDataStore, useStoreData } from "@/lib/dataStore";
import SidebarUser from "./SidebarUser";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "../ThemeToggle";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const RECENT_DOT = ["bg-info", "bg-success", "bg-accent", "bg-warning"];

function NavIcon({ type }: { type: "dashboard" | "projects" | "tasks" }) {
    const paths = {
        dashboard: (
            <>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
            </>
        ),
        projects: (
            <>
                <path d="M3 7.5h18" />
                <path d="M5 5h5l2 2.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9A2 2 0 0 1 5 5Z" />
            </>
        ),
        tasks: (
            <>
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="m8 8 1.5 1.5L12 7" />
                <path d="M14 9h2" />
                <path d="m8 14 1.5 1.5L12 13" />
                <path d="M14 15h2" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[type]}
        </svg>
    );
}

export default function DashboardSidebar({
    projects,
    unreadCount = 0,
    workspaces,
    activeWorkspaceId,
    children,
}: Readonly<{
    projects: Project[];
    unreadCount: number;
    workspaces: { id: string; name: string; type?: string; logoUrl?: string | null }[];
    activeWorkspaceId: string;
    children: React.ReactNode;
}>) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const allProjects = useStoreData(projects, (state) => state.projects);
    const recentProjectIds = useDataStore((state) => state.recentProjectIds);

    const recentProjects = recentProjectIds
        .map((id) => allProjects.find((project) => project.id === id))
        .filter((project): project is Project => Boolean(project));

    const close = () => setOpen(false);

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const navClass = (href: string) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition dark:text-slate-200 ${isActive(href)
            ? "bg-accent-soft font-semibold text-accent shadow-(--clay-inset-high) dark:text-purple-300"
            : "font-medium text-text-secondary hover:bg-accent-soft hover:text-accent dark:hover:text-purple-300"
        }`;

    return (
        <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
            {/* Mobile top bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border-light bg-glass-bg/80 px-4 py-3 backdrop-blur-xl md:hidden">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-(--clay-drop)">
                        T
                    </div>

                    <span className="text-sm font-bold text-text sm:text-base dark:text-white">
                        TaskMate
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open menu"
                    className="
              flex size-9 items-center justify-center
              rounded-xl
              border border-clay-edge
              bg-clay-bg
              text-base text-text
              shadow-(--clay-drop)
            "
                >
                    ☰
                </button>
            </div>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar (drawer on mobile, sticky clay column on md+) */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col p-3
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                <div className="flex h-full flex-col overflow-y-auto rounded-3xl border border-glass-border bg-glass-bg/75 p-5 shadow-(--glass-shadow) backdrop-blur-2xl no-scrollbar">
                    {/* Logo */}
                    <div className="mb-8 flex items-start gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                                className="
                  flex size-11 shrink-0 items-center justify-center
                  rounded-2xl bg-accent
                  font-bold text-white
                  shadow-(--clay-drop)
                "
                            >
                                T
                            </div>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-sm font-bold leading-tight text-text sm:text-base dark:text-white">
                                    Task<br className="sm:hidden" />
                                    <br className="hidden sm:inline" />
                                    Mate
                                </h1>

                                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted dark:text-slate-400">
                                    Workspace
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            <NotificationBell unreadCount={unreadCount} />
                            <ThemeToggle />
                        </div>

                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close menu"
                            className="
                flex size-8 items-center justify-center
                rounded-xl
                text-base text-text-muted
                transition hover:text-text
                md:hidden
              "
                        >
                            ✕
                        </button>
                    </div>

                    {/* Workspace */}
                    <div className="mb-7 rounded-xl border border-white/70 bg-white/55 p-2 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
                        <div className="mb-2 flex items-center justify-between px-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted dark:text-slate-400">
                                Workspace
                            </p>
                            <WorkspaceSwitcher
                                workspaces={workspaces}
                                activeWorkspaceId={activeWorkspaceId}
                                compact
                            />
                        </div>

                        <WorkspaceSwitcher
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            selectOnly
                        />
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1.5">
                        <Link
                            href="/dashboard"
                            onClick={close}
                            className={navClass("/dashboard")}
                        >
                            <NavIcon type="dashboard" />
                            Dashboard
                        </Link>

                        <Link
                            href="/projects"
                            onClick={close}
                            className={navClass("/projects")}
                        >
                            <NavIcon type="projects" />
                            Projects
                        </Link>

                        <Link
                            href="/tasks"
                            onClick={close}
                            className={navClass("/tasks")}
                        >
                            <NavIcon type="tasks" />
                            Tasks
                        </Link>
                    </nav>

                    {/* Recent */}
                    {recentProjects.length > 0 && (
                        <div className="mt-8">
                            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-slate-400">
                                <span className="mr-1.5">🕔</span>
                                Recent
                            </p>

                            {recentProjects.map((project, index) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    onClick={close}
                                    className="
                        mt-1 flex items-center gap-3
                        rounded-xl px-3 py-2
                        text-xs font-medium
                        text-text-secondary
                        transition hover:bg-accent-soft
                        dark:text-slate-300 dark:hover:text-purple-300
                      "
                                >
                                    <span
                                        className={`size-2 shrink-0 rounded-full ${RECENT_DOT[index % RECENT_DOT.length]}`}
                                    />
                                    <span>{project.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Bottom User */}
                    <div className="mt-auto">
                        <SidebarUser />
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="relative min-w-0 flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
}