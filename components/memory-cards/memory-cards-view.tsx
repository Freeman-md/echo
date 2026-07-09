"use client";

import { useCallback, useEffect, useState } from "react";

import { AiMemoryView } from "@/components/ai-memory-view";
import { MemoryCardsContent } from "@/components/memory-cards/memory-cards-content";
import {
  EventMemoryRequestError,
  requestMemoryExtraction,
} from "@/lib/memory/request-memory-extraction";
import { fetchEventMemories } from "@/lib/memories/memory-data";
import type { Event } from "@/types";
import type { EventMemoryData } from "@/types/memory-cards";

interface MemoryCardsViewProps {
  event: Event;
  autoExtract?: boolean;
}

type MemoryCardsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: EventMemoryData };

export function MemoryCardsView({
  event,
  autoExtract = true,
}: MemoryCardsViewProps) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<MemoryCardsState>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchEventMemories(event.id)
      .then((data) => {
        if (active) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load memories for this event.",
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, event.id]);

  const refreshAfterProcessing = useCallback(() => {
    setState({ status: "loading" });
    fetchEventMemories(event.id)
      .then((data) => setState({ status: "ready", data }))
      .catch((error: unknown) =>
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load the new memories.",
        }),
      );
  }, [event.id]);

  async function refreshMemory() {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      await requestMemoryExtraction(event.id, { forceRefresh: true });
      const data = await fetchEventMemories(event.id);
      setState({ status: "ready", data });
    } catch (error) {
      setRefreshError(
        error instanceof EventMemoryRequestError || error instanceof Error
          ? error.message
          : "Echo could not refresh this memory.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function retry() {
    setState({ status: "loading" });
    setAttempt((current) => current + 1);
  }

  if (state.status === "loading") {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="glass-card mt-10 rounded-[1.75rem] px-6 py-11 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-300/15 bg-violet-300/[0.05]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-200 shadow-[0_0_14px_rgba(196,181,253,0.8)]" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">
          Loading memory…
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Echo is gathering what it remembers from this room.
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="glass-card mt-10 rounded-[1.75rem] px-6 py-9 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-rose-200/10 bg-rose-200/[0.05] text-rose-200">
          !
        </span>
        <h2 className="mt-5 text-xl font-semibold text-white">
          Unable to load memories
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

  const hasMemory =
    state.data.people.length > 0 || Boolean(state.data.eventInsight);

  if (!hasMemory) {
    if (!autoExtract) {
      return (
        <section className="glass-card mt-7 rounded-[1.75rem] px-6 py-9 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-violet-200/10 bg-violet-300/[0.05] text-violet-100">
            ✦
          </span>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Turn your batches into memory
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Generate a living memory from every conversation batch captured so
            far. Refresh it whenever new moments are added.
          </p>
          {refreshError && (
            <p
              role="alert"
              className="mx-auto mt-4 max-w-md text-sm leading-6 text-rose-100/75"
            >
              {refreshError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void refreshMemory()}
            disabled={isRefreshing}
            className="button-primary mx-auto mt-6 flex justify-center disabled:cursor-wait disabled:opacity-50"
          >
            {isRefreshing ? "Generating memory…" : "Generate memory"}
          </button>
        </section>
      );
    }

    return (
      <div>
        <AiMemoryView
          eventId={event.id}
          onMemoryReady={refreshAfterProcessing}
        />
        <p className="mx-auto mt-4 max-w-lg text-center text-xs leading-5 text-slate-600">
          No saved memories yet. Echo needs a completed transcript before it
          can remember the people and patterns from this event.
        </p>
      </div>
    );
  }

  return (
    <MemoryCardsContent
      event={event}
      data={state.data}
      isRefreshing={isRefreshing}
      refreshError={refreshError}
      onRefresh={() => void refreshMemory()}
    />
  );
}
