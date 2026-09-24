"use client";

import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/dataStore";
import DeleteProjectButton from "./DeleteProjectButton";

export default function ProjectDeleteButton({
  projectName,
}: {
  projectName: string;
}) {
  const { id } = useParams<{ id: string }>();
  const deleteProject = useDataStore((state) => state.deleteProject);

  return (
    <DeleteProjectButton
      action={deleteProject}
      projectId={id}
      projectName={projectName}
    />
  );
}