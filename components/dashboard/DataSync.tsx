"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/dataStore";
import type { Project, Task } from "@/lib/data";

const REFRESH_INTERVAL_MS = 2000;

type DataSyncProps = {
  projects: Project[];
  tasks: Task[];
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
};

export default function DataSync({
  projects,
  tasks,
  workspaceId,
  workspaceType,
}: DataSyncProps) {
  const router = useRouter();
  const setProjects = useDataStore((state) => state.setProjects);

  useEffect(() => {
    setProjects(projects, tasks, workspaceId, workspaceType);
  }, [projects, tasks, setProjects, workspaceId, workspaceType]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }

    const interval = window.setInterval(
      refreshWhenVisible,
      REFRESH_INTERVAL_MS,
    );
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [router]);

  return null;
}
