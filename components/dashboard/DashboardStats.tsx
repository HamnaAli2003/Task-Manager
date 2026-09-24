"use client";

import { useDataStore } from "@/lib/dataStore";
import StatCard from "./StatCard";

export default function DashboardStats() {
  const projects = useDataStore((state) => state.projects);
  const tasks = useDataStore((state) => state.tasks);

  const totalTasks = tasks.length;
  const inProgress = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const openTasks = totalTasks - doneCount;
  const overdue = tasks.filter(
    (task) => task.status !== "done" && task.due < new Date().toISOString()
  ).length;
  const completionRate = totalTasks > 0
    ? Math.round((doneCount / totalTasks) * 100)
    : 0;

  const stats = [
    {
      label: "Active Projects",
      value: String(projects.length),
      detail: "in workspace",
      icon: "▣",
      iconClass: "bg-accent text-white",
      cardClass: "bg-accent/15",
    },
    {
      label: "Total Tasks",
      value: String(totalTasks),
      detail: `${openTasks} open`,
      icon: "✓",
      iconClass: "bg-info text-white",
      cardClass: "bg-info/15",
    },
    {
      label: "In Progress",
      value: String(inProgress),
      detail: `${overdue} overdue`,
      icon: "◷",
      iconClass: "bg-warning text-white",
      cardClass: "bg-warning/15",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      detail: `${doneCount} completed`,
      icon: "↗",
      iconClass: "bg-success text-white",
      cardClass: "bg-success/15",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}