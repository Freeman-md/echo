"use client";

import type { Event } from "@/types";

interface ActiveEventViewProps {
  event: Event;
  isEnding: boolean;
  error: string | null;
  onEnd: () => void;
}

export function ActiveEventView({
  event,
  isEnding,
  error,
  onEnd,
}: ActiveEventViewProps) {
  const startedAt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.started_at));

  return (
    <section className="mx-auto flex min-h-[42rem] w-full max-w-2xl flex-col justify-center py-14 sm:py-20">
      <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="pointer-events-none absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Active · Listening
            </span>
            <span className="text-xs text-slate-500">Started {startedAt}</span>
          </div>

          <div className="py-14 text-center sm:py-16">
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-violet-300/20 bg-violet-300/[0.07]">
                <span className="h-3 w-3 rounded-full bg-violet-200 shadow-[0_0_18px_rgba(196,181,253,0.9)]" />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Echo is present
            </p>
            <h1 className="mx-auto mt-3 max-w-lg text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {event.name ?? "Untitled event"}
            </h1>
            {event.location && (
              <p className="mt-3 text-sm text-violet-200/70">{event.location}</p>
            )}
            {event.context && (
              <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-sm leading-6 text-slate-500">
                {event.context}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4 text-center">
            <p className="text-sm text-slate-400">
              Conversation capture arrives in Milestone 2.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              No audio is being recorded in this milestone.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-rose-300/10 bg-rose-300/[0.05] px-4 py-3 text-sm text-rose-100/80"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onEnd}
            disabled={isEnding}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full border border-rose-200/10 bg-rose-200/[0.055] px-5 text-sm font-semibold text-rose-100 transition hover:border-rose-200/20 hover:bg-rose-200/[0.09] disabled:cursor-wait disabled:opacity-50"
          >
            {isEnding ? "Ending event…" : "End Event"}
          </button>
        </div>
      </div>
    </section>
  );
}
