type OrbsProps = {
  className?: string;
  subtle?: boolean;
};

export default function Orbs({
  className = "",
  subtle = false,
}: OrbsProps) {
  if (subtle) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${className}`}
      >
        <div
          className="
            absolute -left-32 -top-32
            size-104 rounded-full
            bg-[radial-gradient(ellipse_at_center,var(--blob-1)_0%,var(--blob-2)_48%,transparent_74%)]
            opacity-60 blur-3xl dark:opacity-75 dark:blur-2xl
          "
        />

        <div
          className="
            absolute -right-40 top-1/4
            size-120 rounded-full
            bg-[radial-gradient(ellipse_at_center,var(--blob-2)_0%,var(--blob-3)_48%,transparent_74%)]
            opacity-55 blur-3xl dark:opacity-70 dark:blur-2xl
          "
        />

        <div
          className="
            absolute -bottom-32 left-1/3
            size-104 rounded-full
            bg-[radial-gradient(ellipse_at_center,var(--blob-3)_0%,var(--blob-1)_50%,transparent_74%)]
            opacity-50 blur-3xl dark:opacity-65 dark:blur-2xl
          "
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <div
        className="
          absolute -left-32 -top-32
          size-104 rounded-full
          bg-[radial-gradient(ellipse_at_center,var(--blob-1)_0%,var(--blob-2)_48%,transparent_74%)]
          opacity-85 blur-2xl dark:opacity-85 dark:blur-2xl
        "
      />

      <div
        className="
          absolute -right-40 top-1/4
          size-120 rounded-full
          bg-[radial-gradient(ellipse_at_center,var(--blob-2)_0%,var(--blob-3)_48%,transparent_74%)]
          opacity-80 blur-2xl dark:opacity-80 dark:blur-2xl
        "
      />

      <div
        className="
          absolute -bottom-32 left-1/3
          size-104 rounded-full
          bg-[radial-gradient(ellipse_at_center,var(--blob-3)_0%,var(--blob-1)_50%,transparent_74%)]
          opacity-75 blur-2xl dark:opacity-75 dark:blur-2xl
        "
      />
    </div>
  );
}