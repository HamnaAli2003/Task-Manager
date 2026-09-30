// Members page: workspace members (searchable), pending invite links,
// invite form, and MEMBER-category activity history (added/removed log).
import InviteForm from "@/components/dashboard/InviteForm";
import MembersList from "@/components/dashboard/MembersList";
import ActivityDeleteButton from "@/components/dashboard/ActivityDeleteButton";
import { requireUser, getActiveWorkspace } from "@/lib/workspace.server";
import { listMemberActivity } from "@/lib/activity.server";
import {
  listWorkspaceInvites,
  listWorkspaceMembers,
  revokeInviteAction,
} from "./action";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

const HISTORY_BADGE: Record<string, string> = {
  INVITE_SENT: "bg-info/15 text-info",
  MEMBER_JOINED: "bg-success/15 text-success",
  MEMBER_REMOVED: "bg-danger/15 text-danger",
};

const HISTORY_LABEL: Record<string, string> = {
  INVITE_SENT: "Invite sent",
  MEMBER_JOINED: "Joined",
  MEMBER_REMOVED: "Removed",
};

export default async function MembersPage() {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  const members = await listWorkspaceMembers(workspace.id);

  // Viewer's own membership decides whether Remove buttons render.
  const viewerMembership = members.find(
    (member) => member.user.id === user.id,
  );
  const isOwner =
    viewerMembership?.role === "OWNER" && workspace.ownerId === user.id;
  const hasOwnerPanels = isOwner && workspace.type === "TEAM";

  let pendingInvites: Awaited<ReturnType<typeof listWorkspaceInvites>> = [];
  const history = await listMemberActivity(workspace.id, user.id);
  if (isOwner) {
    pendingInvites = await listWorkspaceInvites(workspace.id);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:py-9">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text">Members</h1>
          <p className="mt-1 text-sm text-text-secondary">
            People in <span className="font-semibold">{workspace.name}</span>
            {hasOwnerPanels ? " and pending invite links." : "."}
          </p>
        </div>

        {isOwner && (
          <section className="mb-6 rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card) sm:p-6">
            <h2 className="mb-1 text-base font-bold text-text">
              Invite someone
            </h2>

            {workspace.type === "PERSONAL" ? (
              <p className="rounded-2xl border border-clay-edge bg-field-bg p-4 text-sm text-text-muted">
                Personal spaces are private. Create a team workspace to invite
                people.
              </p>
            ) : (
              <>
                <p className="mb-4 text-xs text-text-muted">
                  Generates a one-time link (valid 7 days). Share it on WhatsApp
                  or email — no email sending required.
                </p>

                <InviteForm workspaceId={workspace.id} />
              </>
            )}
          </section>
        )}

        <div
          className={`grid grid-cols-1 items-start gap-6 ${hasOwnerPanels ? "lg:grid-cols-2" : ""
            }`}
        >
          {/* Members list (searchable) */}
          <MembersList
            workspaceId={workspace.id}
            isOwner={isOwner}
            viewerId={user.id}
            showSearch={workspace.type !== "PERSONAL"}
            members={members.map((member) => ({
              id: member.id,
              role: member.role,
              user: {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
              },
            }))}
          />

          {hasOwnerPanels && (
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

                        {/* Revoke — imported server action + bind (inline async
                          closures cannot cross the server/client boundary).
                          Hover: solid red bg + white text. */}
                        <form
                          action={
                            revokeInviteAction.bind(null, invite.id) as unknown as (
                              formData: FormData,
                            ) => Promise<void>
                          }
                          className="shrink-0"
                        >
                          <button
                            type="submit"
                            className="
                              inline-flex shrink-0 items-center gap-1.5
                              rounded-full border border-danger/40 bg-danger/10
                              px-3 py-1.5 text-[11px] font-semibold text-danger
                              transition hover:-translate-y-0.5 hover:bg-danger hover:text-white
                            "
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="size-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
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
          )}
        </div>

        <section className="mt-6 rounded-[30px] border border-clay-edge bg-clay-bg p-5 shadow-(--clay-card)">
          <h2 className="mb-4 text-base font-bold text-text">
            Member history
          </h2>

          {history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-clay-edge p-4 text-center text-xs text-text-muted">
              No history yet — invites, joins and removals will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-2xl border border-clay-edge bg-field-bg p-3"
                >
                  <span
                    className={`
                      shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold
                      ${HISTORY_BADGE[event.type] ?? "bg-text-muted/10 text-text-muted"}
                    `}
                  >
                    {HISTORY_LABEL[event.type] ?? event.type}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text">{event.message}</p>
                    <p className="text-[11px] text-text-muted">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <ActivityDeleteButton
                    activityId={event.id}
                    message={event.message}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
