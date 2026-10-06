"use client";

import { useFormStatus } from "react-dom";
import { connectGoogleAction } from "@/app/(dashboard)/profile/actions";

/**
 * Submit button inside the form.
 * `useFormStatus` gives us the pending state with no manual useState.
 */
function ConnectGoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        inline-flex items-center gap-2 rounded-2xl
        border border-accent/40 bg-clay-bg px-4 py-2
        text-sm font-bold text-accent shadow-(--clay-drop)
        transition hover:-translate-y-0.5 hover:bg-accent
        dark:hover:bg-accent dark:hover:text-white
        hover:text-black disabled:cursor-wait disabled:opacity-60
      "
    >
      {pending ? "Connecting..." : "Connect Google"}
    </button>
  );
}

export default function ConnectedAccounts({
  googleLinked,
}: {
  googleLinked: boolean;
}) {
  return (
    <div className="rounded-3xl border border-clay-edge bg-clay-bg p-6 shadow-(--clay-card)">
      <h2 className="text-base font-bold text-text">Connected accounts</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Link Google to this account so you can sign in with it later.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-field-border bg-field-bg px-4 py-3">
        <div className="flex items-center gap-2.5">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-6 w-6 shrink-0">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span className="text-sm font-semibold text-text">Google</span>
        </div>

        {googleLinked ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-success">
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Connected
          </span>
        ) : (
          <form action={connectGoogleAction}>
            <ConnectGoogleButton />
          </form>
        )}
      </div>
    </div>
  );
}
