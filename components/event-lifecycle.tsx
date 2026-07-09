"use client";

import { useState } from "react";

import { ActiveEventView } from "@/components/active-event-view";
import { CompletedEventShell } from "@/components/completed-event-shell";
import { EventClueInput } from "@/components/event-clue-input";
import { EventDraftReview } from "@/components/event-draft-review";
import { completeEvent, createEvent } from "@/lib/events/event-data";
import type { Event } from "@/types";
import type { EventDraft } from "@/types/event-lifecycle";

type LifecycleStage = "home" | "clue" | "draft" | "active" | "completed";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.5 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ensureOriginalClue(draft: EventDraft): string {
  if (draft.context.includes(draft.sourceClue)) return draft.context;

  const label =
    draft.sourceType === "url"
      ? "Original event link"
      : draft.sourceType === "image"
        ? "Screenshot attached"
        : "Original clue";

  return `${draft.context.trim()}\n\n${label}: ${draft.sourceClue}`.trim();
}

export function EventLifecycle() {
  const [stage, setStage] = useState<LifecycleStage>("home");
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  function showDraft(nextDraft: EventDraft) {
    setDraft(nextDraft);
    setError(null);
    setStage("draft");
  }

  async function startEvent(nextDraft: EventDraft) {
    setIsWorking(true);
    setError(null);

    try {
      const createdEvent = await createEvent({
        name: nextDraft.name,
        location: nextDraft.location,
        context: ensureOriginalClue(nextDraft),
      });
      setDraft(nextDraft);
      setActiveEvent(createdEvent);
      setStage("active");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Echo could not start this event.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function endEvent() {
    if (!activeEvent) return;

    setIsWorking(true);
    setError(null);

    try {
      const completedEvent = await completeEvent(activeEvent.id);
      setActiveEvent(completedEvent);
      setStage("completed");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Echo could not complete this event.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function reset() {
    setStage("home");
    setDraft(null);
    setActiveEvent(null);
    setError(null);
    setIsWorking(false);
  }

  if (stage === "clue") {
    return (
      <EventClueInput
        onDraftCreated={showDraft}
        onCancel={() => setStage("home")}
      />
    );
  }

  if (stage === "draft" && draft) {
    return (
      <EventDraftReview
        draft={draft}
        isStarting={isWorking}
        error={error}
        onBack={() => {
          setError(null);
          setStage("clue");
        }}
        onStart={(nextDraft) => void startEvent(nextDraft)}
      />
    );
  }

  if (stage === "active" && activeEvent) {
    return (
      <ActiveEventView
        event={activeEvent}
        isEnding={isWorking}
        error={error}
        onEnd={() => void endEvent()}
      />
    );
  }

  if (stage === "completed" && activeEvent) {
    return <CompletedEventShell event={activeEvent} onReset={reset} />;
  }

  return (
    <section className="flex min-h-[34rem] flex-col items-start justify-center py-20 sm:min-h-[40rem] sm:items-center sm:text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-300/[0.045] px-3 py-1.5 text-xs text-violet-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
        Your conversations, remembered
      </div>

      <h1 className="max-w-3xl text-[3.15rem] font-semibold leading-[0.98] tracking-[-0.065em] text-balance text-white sm:text-7xl">
        Never forget a{" "}
        <span className="bg-gradient-to-r from-violet-200 via-white to-cyan-100 bg-clip-text text-transparent">
          conversation
        </span>{" "}
        again.
      </h1>

      <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
        An AI memory system for real-world networking events. Give Echo one
        clue about the room, then stay present.
      </p>

      <div className="mt-9 flex flex-col items-start gap-3 sm:items-center">
        <button
          type="button"
          onClick={() => setStage("clue")}
          className="button-primary"
        >
          Start Event
          <ArrowIcon />
        </button>
        <p className="pl-2 text-xs text-slate-600 sm:pl-0">
          One clue. A quick check. You&apos;re ready.
        </p>
      </div>
    </section>
  );
}
