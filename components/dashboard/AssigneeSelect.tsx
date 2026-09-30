"use client";

// Multi-assignee picker — avatar/initials ke saath checkbox list.
import { useEffect, useState } from "react";
import { getTaskAssigneeOptionsAction } from "@/app/(dashboard)/projects/[id]/tasks/actions";

type Member = { id: string; name: string; image: string | null; role: string };

function initialsOf(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function AssigneeSelect({
    projectId,
    value,
    onChange,
    error,
}: {
    projectId: string;
    value?: string[];
    onChange: (assigneeIds: string[]) => void;
    error?: string;
}) {
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        let active = true;

        getTaskAssigneeOptionsAction(projectId)
            .then((rows) => {
                if (active) setMembers(rows);
            })
            .catch(() => {
                if (active) setMembers([]);
            });

        return () => {
            active = false;
        };
    }, [projectId]);

    function toggle(id: string) {
        const next = value?.includes(id)
            ? value.filter((item) => item !== id)
            : [...(value ?? []), id];
        onChange(next);
    }

    return (
        <div>
            <span className="mb-1.5 block text-sm font-medium text-text">
                Assignees (required)
            </span>

            {members.length === 0 ? (
                <p className="text-xs text-text-muted">No members to assign.</p>
            ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-clay-edge bg-clay-bg p-2">
                    {members.map((member) => {
                        const checked = value?.includes(member.id) ?? false;
                        return (
                            <li key={member.id}>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-accent-soft">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(member.id)}
                                        className="size-4 rounded accent-purple-500"
                                    />

                                    {member.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={member.image}
                                            alt=""
                                            className="size-7 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                                            {initialsOf(member.name)}
                                        </span>
                                    )}

                                    <span className="min-w-0 flex-1 truncate text-sm text-text">
                                        {member.name}
                                        {member.role === "OWNER" && (
                                            <span className="ml-1" title="Owner">
                                                👑
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            )}

            {value && value.length > 0 && (
                <p className="mt-1.5 text-[11px] text-text-muted">
                    {value.length} assignee(s) — they will be able to update the status
                    only.
                </p>
            )}

            {error ? (
                <p className="mt-1.5 text-xs text-danger" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
