import { Suspense } from "react";
import Link from "next/link";
import ProjectTasksClient from "@/components/dashboard/ProjectTasksClient";

type ProjectTasksPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectTasksPage({
  params,
}: ProjectTasksPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
        <Link
          href={`/projects/${id}`}
          className="
            text-sm font-semibold text-accent
            transition hover:text-accent-hover hover:underline
            underline-offset-4
          "
        >
          ← Back to project
        </Link>

        <Suspense fallback={null}>
          <ProjectTasksClient projectId={id} />
        </Suspense>
      </div>
    </main>
  );
}