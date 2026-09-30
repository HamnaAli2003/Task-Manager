"use client";

// Two-step inline confirm: first click turns the button into
// "Remove {name}? Yes / Cancel" — no accidental removals, no modal needed.
// Removal waits through a 10-second undo window before the server action runs.
// Errors surface via alert; success refreshes the layout so the member disappears.
import { useEffect, useRef, useState, useTransition } from "react";
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
  const [undoSeconds, setUndoSeconds] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  function commitRemoval() {
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

  function handleRemove() {
    setConfirming(false);
    setUndoSeconds(10);

    let secondsRemaining = 10;
    countdownRef.current = window.setInterval(() => {
      secondsRemaining -= 1;

      if (secondsRemaining === 0) {
        if (countdownRef.current) window.clearInterval(countdownRef.current);
        countdownRef.current = null;
        setUndoSeconds(null);
        commitRemoval();
        return;
      }

      setUndoSeconds(secondsRemaining);
    }, 1_000);
  }

  function handleUndo() {
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = null;
    setUndoSeconds(null);
  }

  if (undoSeconds !== null) {
    return (
      <div className="flex shrink-0 items-center gap-2" role="status" aria-live="polite">
        <span className="text-[11px] font-medium text-text-muted">
          Removing in {undoSeconds}s
        </span>
        <button
          type="button"
          onClick={handleUndo}
          className="
            rounded-full border border-accent/40 bg-accent/10
            px-3 py-1.5 text-[11px] font-semibold text-accent
            transition hover:-translate-y-0.5 hover:bg-accent hover:text-white
          "
        >
          Undo
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="shrink-0 rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-[11px] font-semibold text-danger"
      >
        Removing...
      </span>
    );
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
