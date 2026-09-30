// Task cards pe overlapping assignee avatars (+N overflow).
function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AssigneeAvatars({
  assignees,
  max = 3,
}: {
  assignees: { id: string; name: string; image: string | null }[];
  max?: number;
}) {
  if (assignees.length === 0) return null;

  const shown = assignees.slice(0, max);
  const overflow = assignees.length - shown.length;

  return (
    <div
      className="flex -space-x-1.5"
      title={assignees.map((a) => a.name).join(", ")}
    >
      {shown.map((assignee) =>
        assignee.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={assignee.id}
            src={assignee.image}
            alt={assignee.name}
            className="size-5 rounded-full border border-white object-cover dark:border-slate-800"
          />
        ) : (
          <span
            key={assignee.id}
            title={assignee.name}
            className="flex size-5 items-center justify-center rounded-full border border-white bg-accent text-[8px] font-bold text-white dark:border-slate-800"
          >
            {initialsOf(assignee.name)}
          </span>
        ),
      )}
      {overflow > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full border border-white bg-text-muted/20 text-[8px] font-bold text-text dark:border-slate-800">
          +{overflow}
        </span>
      )}
    </div>
  );
}
