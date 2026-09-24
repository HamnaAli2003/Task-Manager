"use client";

// Invite form: optional email + "Generate link" button.
// On success shows the full invite URL with a Copy button so the
// owner can share it (WhatsApp / email / anywhere).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInviteAction } from "@/app/(dashboard)/members/action";

type InviteFormProps = {
  workspaceId: string;
};

export default function InviteForm({ workspaceId }: InviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setInviteLink("");
    setCopied(false);

    startTransition(async () => {
      // Empty email = open link (anyone with it can join).
      const result = await createInviteAction(workspaceId, email.trim());

      if (!result.ok || !result.inviteLink) {
        setError(result.error ?? "Could not create invite.");
        return;
      }

      setInviteLink(result.inviteLink);
      router.refresh(); // pending-invites list updates
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      // Reset the "Copied!" label after a moment.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (rare) — user can still select the text.
      setError("Copy failed — select the link text manually.");
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      {/* Optional email */}
      <div>
        <label
          htmlFor="invite-email"
          className="mb-2 block text-sm font-semibold text-text"
        >
          Email (optional)
        </label>

        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
          placeholder="Leave empty for an open link"
          className="
            w-full rounded-2xl
            border border-field-border
            bg-field-bg
            px-4 py-3
            text-sm text-text
            outline-none
            shadow-(--field-inset)
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
        />

        <p className="mt-1.5 text-[11px] text-text-muted">
          With an email: only that user can accept, and they get a
          notification if they already have an account.
        </p>
      </div>

      {/* Generate button */}
      <button
        type="submit"
        disabled={isPending}
        className="
          rounded-2xl
          bg-accent
          px-4 py-2.5
          text-sm font-bold text-white
          shadow-(--clay-drop)
          transition
          hover:-translate-y-0.5
          hover:bg-accent-hover
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {isPending ? "Generating..." : "Generate invite link"}
      </button>

      {/* Error (from validation or server action) */}
      {error && (
        <p className="text-xs font-medium text-danger">{error}</p>
      )}

      {/* Success: the link + copy */}
      {inviteLink && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Share this link (one-time, expires in 7 days)
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={inviteLink}
              onFocus={(event) => event.currentTarget.select()}
              className="
                min-w-0 flex-1 rounded-xl
                border border-field-border
                bg-background px-3 py-2
                font-mono text-xs text-text
                outline-none
              "
            />

            <button
              type="button"
              onClick={handleCopy}
              className="
                shrink-0 rounded-2xl
                border border-clay-edge
                bg-clay-bg
                px-4 py-2
                text-xs font-semibold text-text-secondary
                shadow-(--clay-drop)
                transition
                hover:-translate-y-0.5
                hover:text-text
              "
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
