"use client";

import { useEffect } from "react";
import { useDataStore } from "@/lib/dataStore";
import type { Project, Task } from "@/lib/data";

type DataSyncProps = {
  projects: Project[];
  tasks: Task[];
};

export default function DataSync({
  projects,
  tasks,
}: DataSyncProps) {
  const setProjects = useDataStore((state) => state.setProjects);

  useEffect(() => {
    setProjects(projects, tasks);
  }, [projects, tasks, setProjects]);

  return null;
}
