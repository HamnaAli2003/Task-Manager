export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
      <div className="h-3 w-28 animate-pulse rounded-full bg-border-light" />

      <div className="mt-6 space-y-3">
        <div className="h-4 w-24 animate-pulse rounded-full bg-border-light" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-xl bg-border-light" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-border-light" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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