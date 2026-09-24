"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col items-center justify-center px-5 text-center">
        <p className="text-6xl font-bold text-danger">!</p>

        <h1 className="mt-4 text-xl font-bold text-text">
          Something went wrong
        </h1>

        <p className="mt-2 max-w-sm text-sm text-text-muted">
          {error.digest ? `Error: ${error.digest}` : "An unexpected error occurred."}
        </p>

        <button
          type="button"
          onClick={reset}
          className="
            mt-6 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold
            text-white shadow-(--clay-drop)
            transition hover:brightness-105
          "
        >
          Try again
        </button>
      </div>
    </main>
  );
}