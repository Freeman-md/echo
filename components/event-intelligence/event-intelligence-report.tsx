"use client";

import Link from "next/link";

import {
  IntelligenceEmptyState,
  IntelligenceSection,
} from "@/components/event-intelligence/intelligence-section";
import type { EventIntelligenceResponse } from "@/types/event-intelligence";

interface EventIntelligenceReportProps {
  result: EventIntelligenceResponse;
  onRegenerate: () => void;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "Unavailable";
  if (minutes < 1) return "Less than a minute";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ""}`;
}

function timingLabel(timing: string): string {
  if (timing === "within_24_hours") return "Within 24 hours";
  if (timing === "this_week") return "This week";
  return "When relevant";
}

function priorityClasses(priority: string): string {
  if (priority === "high") {
    return "border-rose-300/15 bg-rose-300/[0.06] text-rose-100";
  }
  if (priority === "medium") {
    return "border-amber-200/15 bg-amber-200/[0.05] text-amber-100";
  }
  return "border-white/[0.08] bg-white/[0.035] text-slate-300";
}

export function EventIntelligenceReport({
  result,
  onRegenerate,
}: EventIntelligenceReportProps) {
  const { overview, report } = result;
  const confidence = Math.round(report.overall_confidence * 100);
  const overviewMetrics = [
    ["Duration", formatDuration(overview.duration_minutes)],
    ["Conversations", overview.conversation_count],
    ["People remembered", overview.people_count],
    ["AI confidence", `${confidence}%`],
  ];
  const eventMetrics = [
    ["People remembered", report.metrics.people_remembered],
    ["Topics discussed", report.metrics.topics_discussed],
    ["Companies mentioned", report.metrics.companies_mentioned],
    ["Technologies", report.metrics.technologies_mentioned],
    ["Follow-ups", report.metrics.recommended_follow_ups],
    ["High priority", report.metrics.high_priority_people],
    ["Conversations", report.metrics.conversations],
    ["AI confidence", `${confidence}%`],
  ];
  const sourceLabel =
    result.source === "generated"
      ? "Fresh analysis"
      : result.source === "fallback"
        ? "Saved fallback"
        : "Saved analysis";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.06]" />
      <div className="pointer-events-none absolute right-[-10rem] top-[30rem] h-[24rem] w-[24rem] rounded-full bg-cyan-300/[0.035] blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-200"
          >
            <span aria-hidden="true">←</span>
            Echo
          </Link>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-slate-500">
            {sourceLabel}
          </span>
        </nav>

        <header className="py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-300/[0.05] px-3 py-1.5 text-xs font-semibold text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.8)]" />
            Event Intelligence
          </span>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-balance text-white sm:text-7xl">
            {overview.event_name}
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            {overview.event_location || "Location not recorded"}
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
            {overviewMetrics.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-4"
              >
                <p className="text-xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-slate-400/75">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </header>

        {result.warning && (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.04] px-4 py-3 text-sm leading-6 text-amber-100/70"
          >
            {result.warning}
          </p>
        )}

        <div className="space-y-5">
          <IntelligenceSection
            eyebrow="Executive summary"
            title="What happened in this room"
          >
            <p className="max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
              {report.summary}
            </p>
          </IntelligenceSection>

          <IntelligenceSection
            eyebrow="Event metrics"
            title="The room at a glance"
            description="Evidence-backed counts from the event, remembered people, and recommendations."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {eventMetrics.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-4 text-center"
                >
                  <p className="text-2xl font-semibold tracking-tight text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-[0.62rem] uppercase leading-4 tracking-[0.12em] text-slate-400/75">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </IntelligenceSection>

          <div className="grid gap-5 lg:grid-cols-2">
            <IntelligenceSection
              eyebrow="Room patterns"
              title="Signals that repeated"
            >
              {report.patterns.length > 0 ? (
                <ul className="space-y-3">
                  {report.patterns.map((item, index) => (
                    <li
                      key={`${item.pattern}-${index}`}
                      className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"
                    >
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-300/10 text-xs text-violet-200">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-200">
                            {item.pattern}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {item.evidence}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <IntelligenceEmptyState>
                  No recurring pattern had enough evidence.
                </IntelligenceEmptyState>
              )}
            </IntelligenceSection>

            <IntelligenceSection
              eyebrow="Topic breakdown"
              title="What the room talked about"
            >
              {report.topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {report.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-violet-300/10 bg-violet-300/[0.055] px-3 py-2 text-sm text-violet-100/80"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <IntelligenceEmptyState>
                  No reliable event-wide topics were found.
                </IntelligenceEmptyState>
              )}

              {(report.technologies.length > 0 ||
                report.companies.length > 0) && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <TagGroup
                    title="Technologies"
                    values={report.technologies}
                  />
                  <TagGroup title="Companies" values={report.companies} />
                </div>
              )}
            </IntelligenceSection>
          </div>

          <IntelligenceSection
            eyebrow="Priority connections"
            title="Who deserves attention first"
            description="Ranked by the strength and urgency of the observed networking signal."
            accent="amber"
          >
            {report.priority_people.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {report.priority_people.map((person, index) => (
                  <article
                    key={person.person_id}
                    className="rounded-2xl border border-white/[0.07] bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-400/75">
                          Connection {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          {person.name}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${priorityClasses(person.reconnect_priority)}`}
                      >
                        {person.reconnect_priority}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400/75">
                        Why they matter
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-400">
                        {person.why_they_matter}
                      </p>
                    </div>
                    <div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-3.5 py-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-300/60">
                        Next action
                      </p>
                      <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                        {person.suggested_next_action}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <IntelligenceEmptyState>
                Echo did not find enough evidence to rank a connection.
              </IntelligenceEmptyState>
            )}
          </IntelligenceSection>

          <IntelligenceSection
            eyebrow="Follow-up queue"
            title="Your next moves"
            description="A practical queue ordered by the recommendations in this report."
            accent="emerald"
          >
            {report.follow_up_queue.length > 0 ? (
              <ol className="space-y-2">
                {report.follow_up_queue.map((item, index) => (
                  <li
                    key={`${item.action}-${index}`}
                    className="flex gap-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] text-xs font-semibold text-emerald-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.person_name && (
                          <span className="text-xs font-semibold text-slate-300">
                            {item.person_name}
                          </span>
                        )}
                        <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-slate-400/75">
                          {timingLabel(item.timing)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-200">
                        {item.action}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.reason}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <IntelligenceEmptyState>
                No grounded follow-up was recommended.
              </IntelligenceEmptyState>
            )}
          </IntelligenceSection>

          <IntelligenceSection
            eyebrow="Conversation timeline"
            title="How the event unfolded"
            description="Times use saved conversation timestamps. Untimed moments are shown as estimated order."
          >
            {report.timeline.length > 0 ? (
              <ol className="relative ml-2 border-l border-white/[0.08] pl-6">
                {report.timeline.map((item, index) => (
                  <li
                    key={`${item.sequence}-${item.title}`}
                    className={`relative ${
                      index === report.timeline.length - 1 ? "" : "pb-7"
                    }`}
                  >
                    <span className="absolute -left-[1.88rem] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#11131d] bg-violet-300" />
                    <p className="font-mono text-xs text-violet-300/70">
                      {item.time_label}
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold text-slate-200">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <IntelligenceEmptyState>
                There is not enough ordering evidence to build a timeline.
              </IntelligenceEmptyState>
            )}
          </IntelligenceSection>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:justify-between">
          <p className="text-center text-xs text-slate-400/75 sm:text-left">
            Generated{" "}
            {new Date(result.generated_at).toLocaleDateString("en-GB", {
              dateStyle: "medium",
              timeZone: "UTC",
            })}{" "}
            · Evidence stays linked to this event.
          </p>
          <button
            type="button"
            onClick={onRegenerate}
            className="button-secondary"
          >
            Reanalyse event
          </button>
        </div>
      </div>
    </main>
  );
}

function TagGroup({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400/75">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-400"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
