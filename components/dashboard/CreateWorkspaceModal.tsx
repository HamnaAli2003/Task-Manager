"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type CreateWorkspaceModalProps = {
    open: boolean;
    name: string;
    pending: boolean;
    onNameChange: (name: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
    title?: string;
    description?: string;
    submitLabel?: string;
};

export default function CreateWorkspaceModal({
    open,
    name,
    pending,
    onNameChange,
    onCancel,
    onSubmit,
    title = "Create workspace",
    description = "Choose a name for your new workspace.",
    submitLabel = "Create workspace",
}: CreateWorkspaceModalProps) {
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false,
    );

    if (!open || !mounted) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workspace-title"
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
        >
            <button
                type="button"
                aria-label="Close"
                onClick={onCancel}
                className="absolute inset-0 cursor-default"
            />

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
                className="relative w-full max-w-md rounded-xl border border-purple-200/60 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            >
                <h2 id="create-workspace-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {description}
                </p>

                <label htmlFor="new-workspace-name" className="sr-only">
                    Workspace name
                </label>
                <input
                    id="new-workspace-name"
                    value={name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Workspace name"
                    autoFocus
                    className="mt-5 w-full rounded-xl border border-purple-200/60 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 dark:placeholder:text-slate-400"
                />

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-wait focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={pending || !name.trim()}
                        className="rounded-xl border border-purple-500 bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-600 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                        {pending ? "Saving..." : submitLabel}
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    );
}