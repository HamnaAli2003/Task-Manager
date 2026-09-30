"use client";

// Members list with a live search box (client-side filter on name/email —
// no server round-trip). Remove buttons still render only for the owner
// viewing non-owner rows; the server action re-enforces every rule.
import { useMemo, useState } from "react";
import RemoveMemberButton from "./RemoveMemberButton";

export type MemberRow = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
};

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MembersList({
  members,
  workspaceId,
  isOwner,
  viewerId,
  showSearch = true,
}: {
  members: MemberRow[];
  workspaceId: string;
  isOwner: boolean;
  viewerId: string;
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (member) =>
        (member.user.name ?? "").toLowerCase().includes(q) ||
        (member.user.email ?? "").toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <section className="rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card)">
      <h2 className="mb-4 text-base font-bold text-text">
        Members ({filtered.length})
      </h2>

      {showSearch && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search members"
          className="
            mb-4 w-full rounded-2xl
            border border-field-border
            bg-field-bg px-4 py-2.5
            text-sm text-text
            outline-none
            placeholder:text-text-muted
            transition
            focus:border-accent
            focus:ring-2
            focus:ring-accent/20
          "
        />
      )}

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-clay-edge p-4 text-center text-xs text-text-muted">
            No members match &quot;{query}&quot;.
          </li>
        ) : (
          filtered.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-2xl border border-clay-edge bg-field-bg p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {initials(member.user.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {member.user.name ?? "Unnamed user"}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {member.user.email ?? "No email"}
                </p>
              </div>

              {/* Role badge */}
              <span
                className={`
                  shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold
                  ${member.role === "OWNER"
                    ? "bg-accent/15 text-accent"
                    : "bg-info/15 text-info"
                  }
                `}
              >
                {member.role === "OWNER" ? "👑 Owner" : "Member"}
              </span>

              {/* Owner-only remove: never for the owner's own row */}
              {isOwner && member.role !== "OWNER" && member.user.id !== viewerId && (
                <RemoveMemberButton
                  workspaceId={workspaceId}
                  memberId={member.user.id}
                  memberName={member.user.name ?? "this member"}
                />
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
