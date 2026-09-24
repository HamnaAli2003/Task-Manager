"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

type TaskDeleteModalProps = {
  open: boolean;
  matchValue: string;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  /** Override the "to {verb}" phrase after the match value. */
  matchLabel?: string;
  /** Noun used in the "must match the … exactly" hint (e.g. "task title"). */
  matchSubject?: string;
  ariaLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TaskDeleteModal({
  open,
  matchValue,
  title,
  body,
  confirmLabel = "Delete",
  pending = false,
  matchLabel = "to enable deletion",
  matchSubject = "task title",
  ariaLabel = "Type the task title to delete",
  onCancel,
  onConfirm,
}: TaskDeleteModalProps) {
  const isClient = useIsClient();
  const [typed, setTyped] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  if (!open || !isClient) return null;

  const matches = matchValue.length > 0 && typed.trim() === matchValue;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-(--clay-deep)">
        <h2 className="text-lg font-bold text-text">{title}</h2>

        <div className="mt-2 text-sm leading-6 text-text-secondary">{body}</div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-text-secondary">
            Type{" "}
            <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-bold text-text">
              {matchValue || "…"}
            </span>{" "}
            {matchLabel}
          </span>

          <input
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={matchValue || "Task title"}
            aria-label={ariaLabel}
            disabled={pending}
            autoFocus
            className="
              mt-2 w-full rounded-xl border border-border-light
              bg-white px-3 py-2 text-sm text-text
              shadow-sm outline-none transition
              placeholder:text-text-muted
              focus:border-accent focus:ring-2 focus:ring-ring
              dark:border-clay-edge dark:bg-surface-elevated
              disabled:cursor-wait
            "
          />
        </label>

        <p className="mt-2 text-xs" aria-live="polite">
          {matches ? (
            <span className="font-medium text-status-done-text">
              ✓ Match — deletion is enabled.
            </span>
          ) : (
            <span className="text-text-muted">
              The typed text must match the {matchSubject} exactly.
            </span>
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="
              rounded-xl border border-border-light bg-clay-bg px-4 py-2
              text-sm font-semibold text-text-secondary shadow-sm
              transition hover:border-black hover:text-black
              dark:hover:border-white dark:hover:text-white
              disabled:cursor-wait
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={pending || !matches}
            onClick={onConfirm}
            className="
              rounded-xl border border-danger bg-danger px-4 py-2
              text-sm font-semibold text-white shadow-sm
              transition hover:border-danger hover:bg-danger-light
              hover:text-black dark:hover:text-white
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {pending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}