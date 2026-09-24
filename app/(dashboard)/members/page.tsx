// Members page: workspace members, pending invite links, and the
// invite form. Server component — all data comes from server actions/helpers.
import InviteForm from "@/components/dashboard/InviteForm";
import { getActiveWorkspace } from "@/lib/workspace.server";
import {
  listWorkspaceInvites,
  listWorkspaceMembers,
  revokeInviteAction,
} from "./action";

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

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function MembersPage() {
  const workspace = await getActiveWorkspace();

  const [members, pendingInvites] = await Promise.all([
    listWorkspaceMembers(workspace.id),
    listWorkspaceInvites(workspace.id),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:py-9">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text">Members</h1>
          <p className="mt-1 text-sm text-text-secondary">
            People in <span className="font-semibold">{workspace.name}</span>{" "}
            and pending invite links.
          </p>
        </div>

        {/* Invite form */}
        <section className="mb-6 rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card) sm:p-6">
          <h2 className="mb-1 text-base font-bold text-text">
            Invite someone
          </h2>
          <p className="mb-4 text-xs text-text-muted">
            Generates a one-time link (valid 7 days). Share it on WhatsApp or
            email — no email sending required.
          </p>

          <InviteForm workspaceId={workspace.id} />
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Members list */}
          <section className="rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card)">
            <h2 className="mb-4 text-base font-bold text-text">
              Members ({members.length})
            </h2>

            <ul className="space-y-3">
              {members.map((member) => (
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
                      ${
                        member.role === "OWNER"
                          ? "bg-accent/15 text-accent"
                          : "bg-info/15 text-info"
                      }
                    `}
                  >
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pending invites */}
          <section className="rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card)">
            <h2 className="mb-4 text-base font-bold text-text">
              Pending invites ({pendingInvites.length})
            </h2>

            {pendingInvites.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-clay-edge p-4 text-center text-xs text-text-muted">
                No pending invites. Create one above to get a shareable link.
              </p>
            ) : (
              <ul className="space-y-3">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="rounded-2xl border border-clay-edge bg-field-bg p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-text">
                          {invite.email ? invite.email : "Anyone with the link"}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Expires {formatDate(invite.expiresAt)}
                        </p>
                      </div>

                      {/* Revoke = delete the invite; bound action keeps it a server call */}
                      <form
                        action={async () => {
                          await revokeInviteAction(invite.id);
                        }}
                        className="shrink-0"
                      >
                        <button
                          type="submit"
                          className="rounded-2xl border border-clay-edge px-3 py-1.5 text-[11px] font-semibold text-danger transition hover:-translate-y-0.5"
                        >
                          Revoke
                        </button>
                      </form>
                    </div>

                    <p className="mt-2 truncate rounded-xl bg-background px-2 py-1 font-mono text-[10px] text-text-muted">
                      /invite/{invite.token.slice(0, 12)}…
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
