"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type SelectOption = {
  value: string;
  label: string;
  avatar?: string | null;
  fallback?: string;
};

type ClaySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  className?: string;
  showAvatars?: boolean;
};

export default function ClaySelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  ariaLabel,
  error,
  className,
  showAvatars = true,
}: ClaySelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function moveActive(direction: 1 | -1) {
    const start = activeIndex >= 0 ? activeIndex : Math.max(selectedIndex, 0);

    setActiveIndex(
      (start + direction + options.length) % options.length
    );
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(selectedIndex, 0));
      } else {
        moveActive(event.key === "ArrowDown" ? 1 : -1);
      }
    } else if (event.key === "Enter" && !open) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(selectedIndex, 0));
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;

      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;

      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;

      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;

      case "Enter":
      case " ":
        event.preventDefault();

        if (activeIndex >= 0 && activeIndex < options.length) {
          onChange(options[activeIndex].value);
          setOpen(false);
        }
        break;

      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => {
            if (!current) setActiveIndex(Math.max(selectedIndex, 0));
            return !current;
          })
        }
        onKeyDown={handleTriggerKeyDown}
        className={[
          "select-trigger flex w-full items-center justify-between gap-2",
          "border bg-white/80 px-3 py-2.5 pr-10 text-left text-sm text-text",
          "transition focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
          error ? "border-danger" : "border-purple-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
        ].join(" ")}
      >
<span className="flex min-w-0 items-center gap-2 text-left">
            {showAvatars && selected?.avatar ? (
              <img
                src={selected.avatar}
                alt=""
                className="size-7 shrink-0 rounded-lg object-cover"
              />
            ) : showAvatars && selected ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-[10px] font-bold text-white shadow-sm dark:bg-accent dark:text-white">
                {(selected.fallback ?? selected.label).slice(0, 2).toUpperCase()}
              </span>
            ) : null}
            <span
              className="min-w-0 truncate font-semibold"
              title={selected?.label ?? placeholder}
            >
              {selected ? selected.label : placeholder}
            </span>
          </span>

        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          className="
            clay-panel absolute left-0 right-0 z-30 mt-2
            max-h-64 overflow-y-auto border border-purple-200 bg-white/95 p-1.5 nice-scrollbar
            dark:border-slate-700 dark:bg-slate-800
          "
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = activeIndex === index;

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2",
                    "text-sm transition",
                    isSelected
                      ? "bg-accent-soft font-semibold text-accent dark:text-purple-300"
                      : isActive
                        ? "bg-accent/10 text-text dark:text-slate-100"
                        : "text-text hover:bg-accent/10 dark:text-slate-200 dark:hover:bg-accent/10",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {showAvatars && option.avatar ? (
                      <img
                        src={option.avatar}
                        alt=""
                        className="size-7 shrink-0 rounded-full object-cover"
                      />
                    ) : showAvatars ? (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                        {(option.fallback ?? option.label).slice(0, 2).toUpperCase()}
                      </span>
                    ) : null}
                    <span className="min-w-0 truncate" title={option.label}>{option.label}</span>
                  </span>

                  {isSelected && (
                    <span aria-hidden="true" className="text-accent dark:text-purple-300">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div >
  );
}