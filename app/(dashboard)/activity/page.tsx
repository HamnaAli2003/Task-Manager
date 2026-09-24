const activities = [
    {
        id: "1",
        user: "ali",
        initials: "A",
        color: "bg-accent",
        action: "completed",
        target: "Design system tokens",
        time: "10 minutes ago",
    },
    {
        id: "2",
        user: "ali",
        initials: "A",
        color: "bg-info",
        action: "updated",
        target: "Mobile Banking App",
        time: "35 minutes ago",
    },
    {
        id: "3",
        user: "ali",
        initials: "A",
        color: "bg-success",
        action: "created",
        target: "CSV bulk export task",
        time: "1 hour ago",
    },
    {
        id: "4",
        user: "ali",
        initials: "A",
        color: "bg-warning",
        action: "moved",
        target: "Login UI to In Progress",
        time: "2 hours ago",
    },
];

export default function ActivityPage() {
    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        Workspace
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                        Activity
                    </h1>

                    <p className="mt-2 text-sm text-text-secondary">
                        See what has been happening across your workspace.
                    </p>
                </div>

                <section className="rounded-2xl border border-glass-border bg-glass-bg p-5 shadow-lg backdrop-blur-xl">
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <article
                                key={activity.id}
                                className="flex items-start gap-4 rounded-xl border border-border-light bg-surface-elevated p-4"
                            >
                                <div
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activity.color} text-xs font-bold text-white`}
                                >
                                    {activity.initials}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-text">
                                        <span className="font-semibold">
                                            {activity.user}
                                        </span>{" "}
                                        {activity.action}{" "}
                                        <span className="font-semibold text-accent">
                                            {activity.target}
                                        </span>
                                    </p>

                                    <p className="mt-1 text-xs text-text-muted">
                                        {activity.time}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}