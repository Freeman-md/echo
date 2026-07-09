"use client";

import { useEffect, useState } from "react";

const analysisSteps = [
  "Analysing event…",
  "Finding patterns…",
  "Ranking connections…",
  "Preparing recommendations…",
];

export function EventIntelligenceLoading() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) =>
        Math.min(current + 1, analysisSteps.length - 1),
      );
    }, 1_400);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.06]" />
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-12 sm:px-8">
        <section
          aria-live="polite"
          aria-busy="true"
          className="glass-card w-full rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full border border-violet-300/10 [animation-duration:2.6s]" />
            <span className="absolute h-16 w-16 rounded-full border border-violet-300/20 bg-violet-300/[0.04]" />
            <span className="h-3 w-3 rounded-full bg-violet-100 shadow-[0_0_24px_rgba(196,181,253,0.95)]" />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Event Intelligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
            Echo is reading the room.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-500">
            Turning individual memories into an event-wide view of what
            mattered and what to do next.
          </p>

          <ol className="mx-auto mt-9 grid max-w-2xl gap-2 text-left sm:grid-cols-2">
            {analysisSteps.map((step, index) => (
              <li
                key={step}
                aria-current={index === activeStep ? "step" : undefined}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  index <= activeStep
                    ? "border-violet-300/10 bg-violet-300/[0.035] text-slate-300"
                    : "border-white/[0.06] bg-black/20 text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    index === activeStep
                      ? "animate-pulse bg-violet-300"
                      : index < activeStep
                        ? "bg-emerald-300/70"
                        : "bg-violet-300/25"
                  }`}
                />
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
