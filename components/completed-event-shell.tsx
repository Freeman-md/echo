"use client";

import type { Event } from "@/types";

interface CompletedEventShellProps {
  event: Event;
  onReset: () => void;
}

function eventDuration(event: Event): string {
  if (!event.ended_at) return "Duration unavailable";

  const milliseconds =
    new Date(event.ended_at).getTime() - new Date(event.started_at).getTime();
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60_000));

  if (totalMinutes < 1) return "Less than a minute";
  if (totalMinutes < 60)
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

const memoryPlaceholders = [
  {
    title: "People remembered",
    description: "Profiles will appear after memory extraction.",
    symbol: "○",
  },
  {
    title: "Topics discussed",
    description: "The ideas that shaped your conversations.",
    symbol: "◇",
  },
  {
    title: "Follow-ups",
    description: "Promising reasons to reconnect.",
    symbol: "↗",
  },
  {
    title: "Missed opportunities",
    description: "Moments Echo can help you revisit.",
    symbol: "⌁",
  },
];

export function CompletedEventShell({
  event,
  onReset,
}: CompletedEventShellProps) {
  return (
    <section className="mx-auto min-h-[42rem] w-full max-w-3xl py-14 sm:py-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-300/[0.05] px-3 py-1.5 text-xs font-semibold text-violet-200">
          <span aria-hidden="true">✓</span>
          Event completed
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
          {event.name ?? "Your event"}
        </h1>
        <p className="mt-4 text-sm text-slate-500">
          {eventDuration(event)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {memoryPlaceholders.map((item) => (
          <article
            key={item.title}
            className="glass-card min-h-40 rounded-[1.5rem] p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-violet-200">
              {item.symbol}
            </span>
            <h2 className="mt-5 text-base font-semibold text-slate-200">
              {item.title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center">
        <p className="text-sm text-slate-400">
          Conversation memories arrive in a future milestone.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="button-secondary mx-auto mt-7 flex justify-center"
      >
        Return home
      </button>
    </section>
  );
}
