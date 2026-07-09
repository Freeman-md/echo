"use client";

import { useEffect, useState } from "react";

import { PersonMemoryCard } from "@/components/person-memory-card";
import {
  EventMemoryRequestError,
  requestMemoryExtraction,
} from "@/lib/memory/request-memory-extraction";
import type { EventMemoryResponse } from "@/types/memory";

interface AiMemoryViewProps {
  eventId: string;
}

type MemoryViewState =
  | { status: "processing" }
  | {
      status: "error";
      message: string;
      code?: EventMemoryRequestError["code"];
    }
  | { status: "ready"; result: EventMemoryResponse };

const priorityOrder = { high: 0, medium: 1, low: 2, unknown: 3 };

export function AiMemoryView({ eventId }: AiMemoryViewProps) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<MemoryViewState>({
    status: "processing",
  });

  useEffect(() => {
    let active = true;

    requestMemoryExtraction(eventId)
      .then((result) => {
        if (active) setState({ status: "ready", result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Echo could not process this event.",
          code:
            error instanceof EventMemoryRequestError
              ? error.code
              : undefined,
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, eventId]);

  function retry() {
    setState({ status: "processing" });
    setAttempt((current) => current + 1);
  }

  if (state.status === "processing") {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="glass-card mt-10 rounded-[1.75rem] px-6 py-12 text-center sm:px-10"
      >
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span className="absolute h-full w-full animate-ping rounded-full border border-violet-300/10 [animation-duration:2.4s]" />
          <span className="absolute h-14 w-14 rounded-full border border-violet-300/20 bg-violet-300/[0.04]" />
          <span className="h-2.5 w-2.5 rounded-full bg-violet-200 shadow-[0_0_18px_rgba(196,181,253,0.9)]" />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Building AI Memory
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Echo is remembering your conversations…
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Identifying people, discussion themes, memorable details, and useful
          reasons to reconnect.
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    const waitingForTranscript = state.code === "no_transcript";

    return (
      <section className="glass-card mt-10 rounded-[1.75rem] px-6 py-9 text-center sm:px-10">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/10 bg-amber-200/[0.05] text-amber-200">
          !
        </span>
        <h2 className="mt-5 text-xl font-semibold text-white">
          {waitingForTranscript
            ? "The transcript isn’t ready yet"
            : "Echo needs another moment"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          {state.message}
        </p>
        <button
          type="button"
          onClick={retry}
          className="button-secondary mx-auto mt-6 flex justify-center"
        >
          Try again
        </button>
      </section>
    );
  }

  const { memory, reused } = state.result;
  const sortedPeople = [...memory.people].sort(
    (left, right) =>
      priorityOrder[left.reconnect_priority] -
      priorityOrder[right.reconnect_priority],
  );
  const priorityPeople = memory.people.filter(
    (person) => person.reconnect_priority === "high",
  ).length;

  return (
    <section className="mt-10" aria-labelledby="ai-memory-heading">
      <div className="glass-card rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              AI Memory
            </p>
            <h2
              id="ai-memory-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-white"
            >
              What Echo remembers
            </h2>
          </div>
          <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[0.68rem] text-slate-500">
            {reused ? "Saved memory" : "Just processed"} ·{" "}
            {Math.round(memory.event_insight.overall_confidence * 100)}%
            confidence
          </span>
        </div>

        {memory.event_insight.event_summary && (
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            {memory.event_insight.event_summary}
          </p>
        )}

        <div className="mt-7 grid grid-cols-3 gap-2">
          {[
            ["People", memory.people.length],
            ["Topics", memory.event_insight.topics.length],
            ["Priority", priorityPeople],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-4 text-center"
            >
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-slate-600">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              People extracted
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              People worth remembering
            </h2>
          </div>
          <span className="text-xs text-slate-600">
            {sortedPeople.length}{" "}
            {sortedPeople.length === 1 ? "person" : "people"}
          </span>
        </div>

        {sortedPeople.length > 0 ? (
          <div className="grid gap-3">
            {sortedPeople.map((person, index) => (
              <PersonMemoryCard
                key={`${person.name || "unknown"}-${index}`}
                person={person}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-7 text-center text-sm text-slate-500">
            Echo did not find enough evidence to identify a distinct contact.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <MemoryList
          title="Topics discovered"
          values={memory.event_insight.topics}
        />
        <MemoryList
          title="Conversation highlights"
          values={memory.event_insight.conversation_highlights}
        />
        <MemoryList
          title="Patterns"
          values={memory.event_insight.patterns}
        />
        <MemoryList
          title="Recommended follow-ups"
          values={memory.event_insight.recommended_actions}
          accent
        />
      </div>
    </section>
  );
}

function MemoryList({
  title,
  values,
  accent = false,
}: {
  title: string;
  values: string[];
  accent?: boolean;
}) {
  return (
    <article className="glass-card rounded-[1.5rem] p-5">
      <h3
        className={`text-sm font-semibold ${
          accent ? "text-emerald-200" : "text-slate-200"
        }`}
      >
        {title}
      </h3>
      {values.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {values.map((value) => (
            <li key={value} className="flex gap-2 text-sm leading-5 text-slate-400">
              <span className={accent ? "text-emerald-300/70" : "text-violet-300/60"}>
                {accent ? "→" : "•"}
              </span>
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No supported details found.
        </p>
      )}
    </article>
  );
}
