"use client";

import { useEffect, useState } from "react";

import { EventIntelligenceLoading } from "@/components/event-intelligence/event-intelligence-loading";
import { EventIntelligenceReport } from "@/components/event-intelligence/event-intelligence-report";
import {
  EventIntelligenceRequestError,
  requestEventIntelligence,
} from "@/lib/intelligence/request-event-intelligence";
import type {
  EventIntelligenceErrorCode,
  EventIntelligenceResponse,
} from "@/types/event-intelligence";

interface EventIntelligenceViewProps {
  eventId: string;
}

type IntelligenceViewState =
  | { status: "processing" }
  | {
      status: "error";
      message: string;
      code?: EventIntelligenceErrorCode;
    }
  | { status: "ready"; result: EventIntelligenceResponse };

export function EventIntelligenceView({
  eventId,
}: EventIntelligenceViewProps) {
  const [attempt, setAttempt] = useState(0);
  const [regenerate, setRegenerate] = useState(false);
  const [state, setState] = useState<IntelligenceViewState>({
    status: "processing",
  });

  useEffect(() => {
    let active = true;

    requestEventIntelligence(eventId, regenerate)
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
              : "Echo could not prepare Event Intelligence.",
          code:
            error instanceof EventIntelligenceRequestError
              ? error.code
              : undefined,
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, eventId, regenerate]);

  function runAgain(forceRegeneration: boolean) {
    setState({ status: "processing" });
    setRegenerate(forceRegeneration);
    setAttempt((current) => current + 1);
  }

  if (state.status === "processing") {
    return <EventIntelligenceLoading />;
  }

  if (state.status === "error") {
    const waitingForMemory = state.code === "missing_data";

    return (
      <main className="relative flex min-h-screen items-center overflow-hidden px-5 py-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.06]" />
        <section className="glass-card relative mx-auto w-full max-w-xl rounded-[2rem] px-6 py-10 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/10 bg-amber-200/[0.05] text-amber-200">
            !
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">
            Event Intelligence
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {waitingForMemory
              ? "Event memory is still being prepared"
              : "Echo needs another moment"}
          </h1>
          <p role="alert" className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            {state.message}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => runAgain(regenerate)}
              className="button-primary justify-center"
            >
              Try again
            </button>
            <a href="/" className="button-secondary justify-center">
              Return to Echo
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <EventIntelligenceReport
      result={state.result}
      onRegenerate={() => runAgain(true)}
    />
  );
}
