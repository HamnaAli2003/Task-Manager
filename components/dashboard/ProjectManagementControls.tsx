"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjectCapabilitiesAction } from "@/app/(dashboard)/projects/actions";
import ProjectDeleteButton from "./ProjectDeleteButton";

export default function ProjectManagementControls({
    projectId,
    projectName,
}: {
    projectId: string;
    projectName: string;
}) {
    const [canManage, setCanManage] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        void getProjectCapabilitiesAction(projectId).then((access) => {
            if (!active) return;
            setCanManage(access.canManageProject);
            setCanDelete(access.canDeleteProject);
            setLoaded(true);
        });
        return () => {
            active = false;
        };
    }, [projectId]);

    if (!loaded || !canManage) return null;

    return (
        <>
            <Link
                href={`/projects/${projectId}/edit`}
                className="rounded-xl border border-border-light bg-clay-bg px-4 py-2 text-sm font-semibold text-text-secondary shadow-sm transition hover:border-black hover:text-black"
            >
                Edit project
            </Link>
            {canDelete ? <ProjectDeleteButton projectName={projectName} /> : null}
        </>
    );
}