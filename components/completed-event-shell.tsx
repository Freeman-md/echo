"use client";

import Link from "next/link";

import { MemoryCardsView } from "@/components/memory-cards/memory-cards-view";
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

      <MemoryCardsView key={event.id} event={event} />

      <Link
        href={`/events/${event.id}/intelligence`}
        className="button-primary mx-auto mt-8 flex w-fit justify-center"
      >
        View Event Intelligence
        <span aria-hidden="true">→</span>
      </Link>

      <button
        type="button"
        onClick={onReset}
        className="button-secondary mx-auto mt-3 flex justify-center"
      >
        Return home
      </button>
    </section>
  );
}
