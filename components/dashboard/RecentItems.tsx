"use client";

import Link from "next/link";
import { useState } from "react";
import { STATUS_BADGE, STATUS_LABELS } from "@/lib/taskOptions";
import { useDataStore } from "@/lib/dataStore";
import { useUser } from "./useUser";

type RecentTab = "opened" | "assigned" | "completed";

export default function RecentItems() {
    const [activeTab, setActiveTab] = useState<RecentTab>("opened");
    const projects = useDataStore((state) => state.projects);
    const tasks = useDataStore((state) => state.tasks);
    const recentProjectIds = useDataStore((state) => state.recentProjectIds);
    const hydrated = useDataStore((state) => state._hasHydrated);
    const user = useUser();

    const openedProjects = recentProjectIds
        .map((projectId) => projects.find((project) => project.id === projectId))
        .filter((project) => project !== undefined);
    const assignedTasks = tasks.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id),
    );
    const completedTasks = assignedTasks.filter((task) => task.status === "done");
    const visibleTasks = activeTab === "completed" ? completedTasks : assignedTasks;
    const projectNames = new Map(projects.map((project) => [project.id, project.name]));

    const tabs: { id: RecentTab; label: string; count: number }[] = [
        { id: "opened", label: "Opened projects", count: openedProjects.length },
        { id: "assigned", label: "Assigned to me", count: assignedTasks.length },
        { id: "completed", label: "Completed", count: completedTasks.length },
    ];

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
                <div className="mb-7">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        Workspace
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                        Recents
                    </h1>
                </div>

                <div role="tablist" aria-label="Recent items" className="mb-5 flex flex-wrap gap-2 border-b border-border-light">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            id={`recent-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls="recent-items-panel"
                            onClick={() => setActiveTab(tab.id)}
                            className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${activeTab === tab.id
                                    ? "border-accent text-accent"
                                    : "border-transparent text-text-muted hover:text-text"
                                }`}
                        >
                            {tab.label} <span className="ml-1 text-xs text-text-muted">{tab.count}</span>
                        </button>
                    ))}
                </div>

                <section
                    id="recent-items-panel"
                    role="tabpanel"
                    aria-labelledby={`recent-tab-${activeTab}`}
                    className="rounded-2xl border border-glass-border bg-glass-bg p-4 shadow-(--clay-inset-low) sm:p-5"
                >
                    {!hydrated ? (
                        <p className="p-5 text-center text-sm text-text-muted">Loading recent items…</p>
                    ) : activeTab === "opened" ? (
                        openedProjects.length === 0 ? (
                            <EmptyState message="Projects you open will appear here." />
                        ) : (
                            <ul className="divide-y divide-border-light">
                                {openedProjects.map((project, index) => (
                                    <li key={project.id}>
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-accent-soft"
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                                {index + 1}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                                                {project.name}
                                            </span>
                                            <span className="text-xs text-text-muted">Opened</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : visibleTasks.length === 0 ? (
                        <EmptyState
                            message={activeTab === "completed" ? "No completed assigned tasks yet." : "No tasks are assigned to you yet."}
                        />
                    ) : (
                        <ul className="divide-y divide-border-light">
                            {visibleTasks.map((task) => (
                                <li key={task.id}>
                                    <Link
                                        href={`/projects/${task.projectId}/tasks`}
                                        className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-accent-soft"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-text">
                                                {task.title}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-text-muted">
                                                {projectNames.get(task.projectId) ?? "Project"}
                                            </span>
                                        </span>
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_BADGE[task.status]}`}>
                                            {STATUS_LABELS[task.status]}
                                        </span>
                                        <span className="text-xs text-text-muted">Due {task.due}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-border-light p-8 text-center text-sm text-text-muted">
            {message} <Link href="/projects" className="font-semibold text-accent hover:underline">Browse projects</Link>
        </div>
    );
}