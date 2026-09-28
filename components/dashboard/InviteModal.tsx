"use client";

// Header "Invite" modal — one dialog, three states based on the ACTIVE
// workspace type + the viewer's role:
//  1. PERSONAL workspace      -> upsell: private-space explanation +
//     "Create a team workspace" CTA. The CTA fires the
//     "pmp:open-create-workspace" event which the sidebar
//     WorkspaceSwitcher listens for, opening the same create-workspace
//     modal the "+" icon uses.
//  2. TEAM, non-owner member  -> upsell: "only the owner can invite" +
//     "Create your own workspace" CTA (fires the same event).
//  3. TEAM, owner             -> the real invite flow: the existing
//     InviteForm (optional email + one-time link with copy).
// The server action re-enforces every rule even if the button is forged.
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import InviteForm from "./InviteForm";

type InviteModalProps = {
  open: boolean;
  workspaceId: string;
  workspaceType: string;
  canInvite: boolean;
  onClose: () => void;
};

export default function InviteModal({
  open,
  workspaceId,
  workspaceType,
  canInvite,
  onClose,
}: InviteModalProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!open || !mounted) return null;

  const isPersonal = workspaceType === "PERSONAL";
  // TEAM workspace, but the viewer is NOT the owner -> member upsell.
  const isMemberUpsell = !isPersonal && !canInvite;

  function handleCreateTeamWorkspace() {
    // Ask the sidebar switcher to open its create-workspace modal.
    window.dispatchEvent(new Event("pmp:open-create-workspace"));
    onClose();
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={
        isPersonal
          ? "invite-upsell-title"
          : isMemberUpsell
            ? "invite-member-upsell-title"
            : "invite-modal-title"
      }
      className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"      />

      <div className="relative w-full max-w-md rounded-xl border border-purple-200/60 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        {isPersonal ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:text-purple-300">
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>

            <h2
              id="invite-upsell-title"
              className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Personal spaces are private
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your Personal workspace is just for you. Create a team workspace
              to invite people and collaborate.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCreateTeamWorkspace}
                className="
                  w-full rounded-xl
                  border border-purple-500 bg-purple-500
                  px-4 py-2.5
                  text-sm font-semibold text-white
                  shadow-sm
                  transition hover:bg-purple-600
                  disabled:cursor-wait disabled:opacity-60
                  focus:outline-none focus:ring-0
                  focus-visible:outline-none focus-visible:ring-0
                "
              >
                Create a team workspace
              </button>

              <button
                type="button"
                onClick={onClose}
                className="
                  w-full rounded-xl
                  border border-slate-200 bg-white
                  px-4 py-2.5
                  text-sm font-semibold text-slate-600
                  transition hover:border-slate-300 hover:text-slate-900
                  focus:outline-none focus:ring-0
                  focus-visible:outline-none focus-visible:ring-0
                  dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300
                  dark:hover:border-slate-500 dark:hover:text-slate-100
                "
              >
                Not now
              </button>
            </div>
          </div>
        ) : isMemberUpsell ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:text-purple-300">
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h2
              id="invite-member-upsell-title"
              className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Only the owner can invite here
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You are a member of this workspace, but invitations are reserved
              for its owner. Create your own team workspace and invite anyone
              you like.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCreateTeamWorkspace}
                className="
                  w-full rounded-xl
                  border border-purple-500 bg-purple-500
                  px-4 py-2.5
                  text-sm font-semibold text-white
                  shadow-sm
                  transition hover:bg-purple-600
                  disabled:cursor-wait disabled:opacity-60
                  focus:outline-none focus:ring-0
                  focus-visible:outline-none focus-visible:ring-0
                "
              >
                Create your own workspace
              </button>

              <button
                type="button"
                onClick={onClose}
                className="
                  w-full rounded-xl
                  border border-slate-200 bg-white
                  px-4 py-2.5
                  text-sm font-semibold text-slate-600
                  transition hover:border-slate-300 hover:text-slate-900
                  focus:outline-none focus:ring-0
                  focus-visible:outline-none focus-visible:ring-0
                  dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300
                  dark:hover:border-slate-500 dark:hover:text-slate-100
                "
              >
                Not now
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              id="invite-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Invite to workspace
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Generates a one-time invite link. Share it anywhere — no email
              sending required.
            </p>

            <div className="mt-5">
              <InviteForm workspaceId={workspaceId} />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
