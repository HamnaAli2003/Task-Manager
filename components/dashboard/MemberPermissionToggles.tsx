"use client";

// Members page: owner live toggle karta hai member ka task right.
// Server action hi asal authority hai — UI sirf control dikhata hai.
import { useTransition } from "react";
import { setMemberPermissionsAction } from "@/app/(dashboard)/members/action";

type MemberPermissionTogglesProps = {
  workspaceId: string;
  memberId: string;
  canCreateTask: boolean;
};

export default function MemberPermissionToggles({
  workspaceId,
  memberId,
  canCreateTask,
}: MemberPermissionTogglesProps) {
  const [pending, startTransition] = useTransition();

  function update(next: boolean) {
    startTransition(async () => {
      const result = await setMemberPermissionsAction(
        workspaceId,
        memberId,
        next,
      );

      if (!result.ok) {
        window.alert(result.error ?? "Could not update permissions.");
      }
    });
  }

  return (
    <label
      className={`flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-text-secondary ${pending ? "opacity-60" : ""}`}
      title="Owner-granted: member can create, edit and delete tasks"
    >
      <input
        type="checkbox"
        checked={canCreateTask}
        disabled={pending}
        onChange={(event) => update(event.target.checked)}
        className="size-3.5 rounded accent-purple-500"
      />
      +Tasks
    </label>
  );
}
