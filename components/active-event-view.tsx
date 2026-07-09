"use client";

import { useState } from "react";

import { ConversationCapture } from "@/components/conversation-capture";
import { MemoryCardsView } from "@/components/memory-cards/memory-cards-view";
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
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [isMemoryProcessing, setIsMemoryProcessing] = useState(false);
  const startedAt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.started_at));

  return (
    <section className="mx-auto w-full max-w-3xl py-10 sm:py-14">
      <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="pointer-events-none absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Active event
            </span>
            <span className="text-xs text-slate-500">Started {startedAt}</span>
          </div>

          <div className="py-9 text-center sm:py-11">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Echo is present
            </p>
            <h1 className="mx-auto mt-3 max-w-lg text-4xl font-semibold tracking-[-0.05em] text-white">
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

          <ConversationCapture
            eventId={event.id}
            onCaptureActivityChange={setIsCaptureActive}
          />

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
            disabled={isEnding || isCaptureActive || isMemoryProcessing}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full border border-rose-200/10 bg-rose-200/[0.055] px-5 text-sm font-semibold text-rose-100 transition hover:border-rose-200/20 hover:bg-rose-200/[0.09] disabled:cursor-wait disabled:opacity-50"
          >
            {isEnding
              ? "Ending event…"
              : isCaptureActive
                ? "Finish capture before ending"
                : isMemoryProcessing
                  ? "Finish memory refresh before ending"
                : "End Event"}
          </button>
        </div>
      </div>

      <MemoryCardsView
        event={event}
        autoExtract={false}
        onProcessingChange={setIsMemoryProcessing}
      />
    </section>
  );
}
