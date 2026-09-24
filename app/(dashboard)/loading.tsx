export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded-full bg-border-light" />
          <div className="h-8 w-72 max-w-full animate-pulse rounded-xl bg-border-light" />
        </div>

        <div className="h-10 w-32 animate-pulse rounded-xl bg-border-light" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-border-light"
          />
        ))}
      </div>
    </div>
  );
}