"use client";

// Accept button: calls the server action; on success the action
// redirects to /dashboard, on failure we show the error inline.
import { useState, useTransition } from "react";
import { acceptInviteAction } from "./action";

export default function InviteAcceptButton({ token }: { token: string }) {
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleAccept() {
        setError("");

        startTransition(async () => {
            const result = await acceptInviteAction(token);

            // Only reachable on failure — success redirects to /dashboard.
            if (result && !result.ok) {
                setError(result.error ?? "Could not accept this invite.");
            }
        });
    }

    return (
        <div className="mt-6 space-y-3">
            {error && (
                <p className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                    {error}
                </p>
            )}

            <button
                type="button"
                onClick={handleAccept}
                disabled={isPending}
                className="
          w-full rounded-2xl
          bg-accent
          px-4 py-3
          text-sm font-bold text-white
          shadow-(--clay-drop)
          transition
          hover:-translate-y-0.5
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
            >
                {isPending ? "Joining..." : "Accept invite"}
            </button>
        </div>
    );
}
