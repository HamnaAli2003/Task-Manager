type StatCardProps = {
    label: string;
    value: string;
    detail: string;
    icon: string;
    iconClass: string;
    cardClass?: string;
};

export default function StatCard({
    label,
    value,
    detail,
    icon,
    iconClass,
    cardClass = "",
}: StatCardProps) {
    return (
        <div
            className={`
        rounded-3xl
        border border-glass-border
        p-5
        shadow-(--clay-drop)
        backdrop-blur-xl
        transition duration-200
        hover:-translate-y-1
        ${cardClass}
      `}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className={`
            flex size-10 items-center justify-center
            rounded-xl
            ${iconClass}
            text-sm font-bold
            shadow-(--clay-inset-high)
          `}
                >
                    {icon}
                </div>

                <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-[9px] font-medium text-text-muted">
                    {detail}
                </span>
            </div>

            <p className="mt-5 text-2xl font-bold text-text">
                {value}
            </p>

            <p className="mt-1 text-xs font-medium text-text-secondary">
                {label}
            </p>
        </div>
    );
}