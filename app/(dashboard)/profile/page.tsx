import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/dashboard/ProfileForm";
import ConnectedAccounts from "@/components/dashboard/ConnectedAccounts";
import WorkspacesCustomization from "@/components/dashboard/WorkspacesCustomization";
import { getUserWorkspaces } from "@/lib/workspace.server";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; error?: string }>;
}) {
  const { linked } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      accounts: { select: { provider: true } },
    },
  });
  if (!user) redirect("/login");

  const googleLinked = user.accounts.some(
    (account) => account.provider === "google"
  );

  // All workspaces this user belongs to, for the branding cards below.
  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Account
      </p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
        Profile
      </h1>

      <p className="mt-2 text-sm text-text-secondary">
        Manage your profile picture, details, and account.
      </p>

      {linked === "1" && (
        <div
          className="
            mt-4 rounded-2xl border border-success/40 bg-success/10 px-4 py-3
            text-sm font-semibold text-success
          "
        >
          Your Google account is now connected to this account.
        </div>
      )}

      <div className="mt-6 space-y-6">
        <ProfileForm
          initialName={user.name ?? ""}
          initialEmail={user.email ?? ""}
          initialImage={user.image}
          initialBio={user.bio ?? ""}
        />

        <WorkspacesCustomization
          workspaces={workspaces.map((workspace) => ({
            id: workspace.id,
            name: workspace.name,
            logoUrl: workspace.logoUrl,
            memberCount: workspace.memberCount,
            role: workspace.role ?? "MEMBER",
          }))}
        />

        <ConnectedAccounts googleLinked={googleLinked} />
      </div>
    </main>
  );
}