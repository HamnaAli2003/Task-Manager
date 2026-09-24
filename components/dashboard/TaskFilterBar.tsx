"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ClaySelect from "./ClaySelect";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/taskOptions";

export default function TaskFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    const current = searchParamsString
      ? `${pathname}?${searchParamsString}`
      : pathname;

    if (current === target) return;

    router.replace(target, { scroll: false });
  }, [search, pathname, router, searchParamsString]);

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(name, value);
    else params.delete(name);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clear() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const hasFilters = Boolean(status || priority || search);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-40 flex-1">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="
            w-full rounded-xl border border-border-light
            bg-white py-2 pl-9 pr-3 text-sm text-text
            shadow-sm outline-none transition
            placeholder:text-text-muted
            focus:border-accent
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400
          "
        />
      </label>

      <ClaySelect
        value={status}
        onChange={(value) => update("status", value)}
        options={[
          { value: "", label: "All statuses" },
          ...TASK_STATUSES.map((value) => ({
            value,
            label: STATUS_LABELS[value],
          })),
        ]}
        ariaLabel="Filter by status"
        className="w-44"
        showAvatars={false}
      />

      <ClaySelect
        value={priority}
        onChange={(value) => update("priority", value)}
        options={[
          { value: "", label: "All priorities" },
          ...TASK_PRIORITIES.map((value) => ({
            value,
            label: PRIORITY_LABELS[value],
          })),
        ]}
        ariaLabel="Filter by priority"
        className="w-44"
        showAvatars={false}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={clear}
          className="
            rounded-xl px-3 py-2 text-sm font-medium text-text-muted
            transition hover:text-text
          "
        >
          Clear
        </button>
      )}
    </div>
  );
}