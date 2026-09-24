"use client";

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

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title,
  body,
  confirmLabel = "Delete",
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const isClient = useIsClient();

  if (!open || !isClient) return null;

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
            disabled={pending}
            onClick={onConfirm}
            className="
              rounded-xl border border-danger bg-danger px-4 py-2
              text-sm font-semibold text-white shadow-sm
              transition hover:border-danger hover:bg-danger-light
              hover:text-black dark:hover:text-white disabled:cursor-wait
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