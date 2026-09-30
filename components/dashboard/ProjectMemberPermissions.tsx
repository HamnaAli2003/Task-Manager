"use client";

import { useEffect, useState, useTransition } from "react";
import {
    getProjectMemberPermissionsAction,
    setProjectMemberPermissionsAction,
    type ProjectMemberPermission,
} from "@/app/(dashboard)/projects/actions";

type PermissionKey = "canCreateTasks" | "canDeleteTasks" | "canEditProject";

export default function ProjectMemberPermissions({
    projectId,
}: {
    projectId: string;
}) {
    const [members, setMembers] = useState<ProjectMemberPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        let active = true;
        void getProjectMemberPermissionsAction(projectId).then((result) => {
            if (!active) return;
            if (!result.ok) {
                setError(result.error);
            } else {
                setAuthorized(true);
                setMembers(result.members);
            }
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [projectId]);

    if (loading || !authorized) return null;

    function updatePermission(userId: string, key: PermissionKey, checked: boolean) {
        const previous = members.find((member) => member.userId === userId);
        if (!previous) return;

        const updated = { ...previous, [key]: checked };
        setMembers((current) =>
            current.map((member) => member.userId === userId ? updated : member),
        );
        setError("");

        startTransition(async () => {
            const result = await setProjectMemberPermissionsAction(projectId, userId, {
                canCreateTasks: updated.canCreateTasks,
                canDeleteTasks: updated.canDeleteTasks,
                canEditProject: updated.canEditProject,
            });
            if (!result.ok) {
                setMembers((current) =>
                    current.map((member) => member.userId === userId ? previous : member),
                );
                setError(result.error ?? "Could not update project permissions.");
            }
        });
    }

    return (
        <section className="mt-8 rounded-2xl border border-glass-border bg-glass-bg p-5 shadow-(--clay-inset-low)">
            <div className="mb-4">
                <h2 className="text-base font-bold text-text">Project member rights</h2>
                <p className="mt-1 text-xs text-text-muted">
                    Choose who can create tasks, delete tasks, or edit this project.
                </p>
            </div>

            {members.length === 0 ? (
                <p className="text-sm text-text-muted">No workspace members to configure.</p>
            ) : (
                <ul className="divide-y divide-border-light">
                    {members.map((member) => (
                        <li key={member.userId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-text">{member.name}</p>
                                {member.email ? <p className="truncate text-xs text-text-muted">{member.email}</p> : null}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {([
                                    ["canCreateTasks", "Create tasks"],
                                    ["canDeleteTasks", "Delete tasks"],
                                    ["canEditProject", "Edit project"],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                                        <input
                                            type="checkbox"
                                            checked={member[key]}
                                            disabled={pending}
                                            onChange={(event) => updatePermission(member.userId, key, event.target.checked)}
                                            className="size-4 rounded accent-purple-500"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {error ? <p role="alert" className="mt-3 text-xs text-danger">{error}</p> : null}
        </section>
    );
}