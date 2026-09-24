import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col items-center justify-center px-5 text-center">
        <p className="text-6xl font-bold text-accent">404</p>

        <h1 className="mt-4 text-xl font-bold text-text">
          Project not found
        </h1>

        <p className="mt-2 max-w-sm text-sm text-text-muted">
          It may have been deleted, or the link is missing an ID.
        </p>

        <Link
          href="/projects"
          className="
            mt-6 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold
            text-white shadow-(--clay-drop)
            transition hover:brightness-105
          "
        >
          Back to projects
        </Link>
      </div>
    </main>
  );
}