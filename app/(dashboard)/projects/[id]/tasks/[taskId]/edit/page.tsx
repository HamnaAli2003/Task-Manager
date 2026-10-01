import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, getActiveWorkspace } from "@/lib/workspace.server";
import { getProjectAccess, getTaskFieldAccess } from "@/lib/access.server";
import { getProject, getTask } from "@/lib/data.server";
import EditTaskPanel from "@/components/dashboard/EditTaskPanel";

type EditTaskPageProps = {
  params: Promise<{ id: string; taskId: string }>;
};

/** The URL is directly reachable, so authorize here as well as in the action. */
export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id, taskId } = await params;
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  // Check project visibility first so a task outside the caller's reach is
  // reported as missing rather than as a permission problem.
  const projectAccess = await getProjectAccess(user.id, id);
  if (!projectAccess.canView) notFound();

  // Field-level access decides what the form may even render. A member with
  // neither status nor detail rights has no business on this page at all.
  const taskAccess = await getTaskFieldAccess(user.id, workspace.id, taskId);
  if (!taskAccess?.canEdit) notFound();

  const [task, project] = await Promise.all([
    getTask(workspace.id, taskId),
    getProject(workspace.id, id),
  ]);
  if (!task || !project) notFound();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:py-9">
        <Link
          href={`/projects/${project.id}/tasks`}
          className="
            text-sm font-semibold text-accent
            transition hover:text-accent-hover hover:underline
            underline-offset-4
          "
        >
          ← Back to tasks
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {project.name}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Edit task
          </h1>
        </div>

        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep) backdrop-blur-xl">
          <EditTaskPanel
            task={task}
            projectId={project.id}
            redirectTo={`/projects/${project.id}/tasks`}
            requiresAssignee={workspace.type !== "PERSONAL"}
            canChangeStatus={taskAccess.canUpdateStatus}
            canEditDetails={taskAccess.canEditDetails}
            canManageAssignees={taskAccess.canManageAssignees}
          />
        </section>
      </div>
    </main>
  );
}
