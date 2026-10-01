"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissActivityEventAction } from "@/app/(dashboard)/activity/actions";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function ActivityDeleteButton({
    activityId,
    message,
    showSharedVisibility,
}: {
    activityId: string;
    message: string;
    showSharedVisibility: boolean;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState("");

    function onDelete() {
        startTransition(async () => {
            const result = await dismissActivityEventAction(activityId);
            if (!result.ok) {
                setError(result.error ?? "Could not delete activity.");
                setOpen(false);
                return;
            }

            setOpen(false);
            setError("");
            router.refresh();
        });
    }

    return (
        <div className="flex shrink-0 flex-col items-end gap-2">
            <button
                type="button"
                onClick={() => {
                    setError("");
                    setOpen(true);
                }}
                disabled={pending}
                aria-label="Hide activity from my view"
                title="Hide activity from my view"
                className="rounded-lg p-2 text-text-muted transition hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-wait"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="m19 6-1 14H6L5 6" />
                    <path d="M10 11v5M14 11v5" />
                </svg>
            </button>

            {error ? (
                <p role="alert" className="max-w-40 text-right text-xs text-danger">
                    {error}
                </p>
            ) : null}

            <ConfirmDeleteModal
                open={open}
                title="Hide activity?"
                body={
                    <>
                        This will hide this activity from your view.
                        {showSharedVisibility && " Other workspace members will still see it: "}
                        <span className="font-semibold text-text">&quot;{message}&quot;</span>
                    </>
                }
                confirmLabel="Hide activity"
                pending={pending}
                onCancel={() => setOpen(false)}
                onConfirm={onDelete}
            />
        </div>
    );
}