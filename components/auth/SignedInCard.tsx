import Link from "next/link";
import { logout } from "@/app/(auth)/login/action";

export default function SignedInCard({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <section className="w-full max-w-md">
      <div
        className="
          rounded-[30px]
          border border-clay-edge
          bg-clay-bg
          p-6
          text-center
          shadow-(--clay-card)
          sm:p-8
        "
      >
        <div className="mb-4 text-3xl">✅</div>

        <h1 className="text-2xl font-bold text-text">You&apos;re already signed in</h1>

        <p className="mt-2 text-sm text-text-secondary">
          {name ? `${name}` : "You"} are currently logged in
          {email ? ` as ${email}` : ""}. Go back to your dashboard to continue
          working, or log out to switch accounts.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="
              flex w-full items-center justify-center gap-2
              rounded-2xl
              border border-accent
              bg-accent
              px-4 py-3
              text-sm font-semibold
              text-white
              shadow-(--clay-drop)
              transition
              hover:-translate-y-0.5
              hover:bg-accent-hover
            "
          >
            Go to Dashboard
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="
                w-full rounded-2xl
                border border-clay-edge
                bg-clay-bg
                px-4 py-3
                text-sm font-semibold
                text-text-secondary
                shadow-(--clay-inset-high)
                transition
                hover:text-danger
              "
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        Project Management Portal
      </p>
    </section>
  );
}