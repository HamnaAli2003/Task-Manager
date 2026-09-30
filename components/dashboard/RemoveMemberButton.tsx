"use client";

// Two-step inline confirm: first click turns the button into
// "Remove {name}? Yes / Cancel" — no accidental removals, no modal needed.
// Errors surface via alert; success refreshes the layout so the member
// disappears from the list (and loses access immediately, server-side).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeMemberAction } from "@/app/(dashboard)/members/action";

type RemoveMemberButtonProps = {
  workspaceId: string;
  memberId: string;
  memberName: string;
};

export default function RemoveMemberButton({
  workspaceId,
  memberId,
  memberName,
}: RemoveMemberButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, memberId);

      if (!result.ok) {
        window.alert(result.error ?? "Could not remove this member.");
        setConfirming(false);
        return;
      }

      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="
          shrink-0 rounded-full border border-danger/40 bg-danger/10
          px-3 py-1.5 text-[11px] font-semibold text-danger
          transition hover:-translate-y-0.5 hover:bg-danger hover:text-white
          disabled:cursor-wait disabled:opacity-60
        "
      >
        Remove
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-[11px] font-medium text-text-muted">
        Remove {memberName}?
      </span>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="
          rounded-full border border-danger/40 bg-danger/10
          px-3 py-1.5 text-[11px] font-semibold text-danger
          transition hover:-translate-y-0.5 hover:bg-danger hover:text-white
          disabled:cursor-wait disabled:opacity-60
        "
      >
        {isPending ? "Removing..." : "Yes"}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="
          rounded-full border border-clay-edge bg-clay-bg
          px-3 py-1.5 text-[11px] font-semibold text-text-secondary
          transition hover:-translate-y-0.5 hover:border-black hover:text-text
          disabled:cursor-wait disabled:opacity-60
        "
      >
        Cancel
      </button>
    </div>
  );
}
