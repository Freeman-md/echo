import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { memoryExtractionSchema } from "@/lib/memory/schema";
import {
  storedEventIntelligenceSchema,
  type EventIntelligenceReport,
  type StoredEventIntelligence,
} from "@/lib/intelligence/schema";
import type { Event, EventInsight, PersonMemory, Transcript } from "@/types";
import type {
  EventIntelligenceErrorCode,
  EventIntelligenceOverview,
} from "@/types/event-intelligence";

export class EventIntelligenceServiceError extends Error {
  constructor(
    message: string,
    public readonly code: EventIntelligenceErrorCode,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EventIntelligenceServiceError";
  }
}

export interface EventIntelligenceSource {
  event: Event;
  people: PersonMemory[];
  transcripts: Transcript[];
  insights: EventInsight[];
  memoryInsight: EventInsight | null;
}

export interface StoredReportMatch {
  insight: EventInsight;
  intelligence: StoredEventIntelligence;
}

function databaseError(message: string): EventIntelligenceServiceError {
  return new EventIntelligenceServiceError(message, "database_error", 500);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasMemoryCheckpoint(insight: EventInsight): boolean {
  return memoryExtractionSchema.safeParse(insight.raw_json).success;
}

export async function loadEventIntelligenceSource(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventIntelligenceSource> {
  const [eventResult, peopleResult, transcriptResult, insightResult] =
    await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
      supabase
        .from("people")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("transcripts")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("event_insights")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (eventResult.error) {
    throw databaseError(`Could not load event: ${eventResult.error.message}`);
  }
  if (!eventResult.data) {
    throw new EventIntelligenceServiceError(
      "This event could not be found.",
      "event_not_found",
      404,
    );
  }
  if (eventResult.data.status !== "completed") {
    throw new EventIntelligenceServiceError(
      "Finish the event before generating Event Intelligence.",
      "event_not_completed",
      409,
    );
  }
  if (peopleResult.error) {
    throw databaseError(
      `Could not load remembered people: ${peopleResult.error.message}`,
    );
  }
  if (transcriptResult.error) {
    throw databaseError(
      `Could not load conversation timeline: ${transcriptResult.error.message}`,
    );
  }
  if (insightResult.error) {
    throw databaseError(
      `Could not load prior event insights: ${insightResult.error.message}`,
    );
  }

  const insights = (insightResult.data ?? []) as EventInsight[];

  return {
    event: eventResult.data as Event,
    people: (peopleResult.data ?? []) as PersonMemory[],
    transcripts: (transcriptResult.data ?? []) as Transcript[],
    insights,
    memoryInsight: insights.find(hasMemoryCheckpoint) ?? null,
  };
}

export function findStoredEventIntelligence(
  insights: EventInsight[],
): StoredReportMatch | null {
  for (const insight of insights) {
    if (!isObject(insight.raw_json)) continue;

    const parsed = storedEventIntelligenceSchema.safeParse(
      insight.raw_json.event_intelligence,
    );
    if (parsed.success) {
      return { insight, intelligence: parsed.data };
    }
  }

  return null;
}

export function assertIntelligenceEvidence(source: EventIntelligenceSource) {
  if (source.memoryInsight) {
    const checkpoint = memoryExtractionSchema.safeParse(
      source.memoryInsight.raw_json,
    );

    if (
      checkpoint.success &&
      source.people.length < checkpoint.data.people.length
    ) {
      throw new EventIntelligenceServiceError(
        "Some remembered people are still being saved. Retry memory extraction, then try again.",
        "missing_data",
        409,
      );
    }

    return;
  }

  throw new EventIntelligenceServiceError(
    "Event memories are still being prepared. Finish memory extraction, then try again.",
    "missing_data",
    409,
  );
}

export function buildSourceFingerprint(
  source: EventIntelligenceSource,
): string {
  const checkpoint = source.memoryInsight
    ? memoryExtractionSchema.safeParse(source.memoryInsight.raw_json)
    : null;
  const evidence = {
    event: {
      id: source.event.id,
      name: source.event.name,
      location: source.event.location,
      context: source.event.context,
      started_at: source.event.started_at,
      ended_at: source.event.ended_at,
    },
    people: source.people,
    transcripts: source.transcripts.map((transcript) => ({
      id: transcript.id,
      raw_text: transcript.raw_text,
      source: transcript.source,
      created_at: transcript.created_at,
    })),
    memory_checkpoint: checkpoint?.success
      ? checkpoint.data
      : source.memoryInsight
        ? {
            summary: source.memoryInsight.summary,
            key_topics: source.memoryInsight.key_topics,
            patterns: source.memoryInsight.patterns,
            recommended_next_actions:
              source.memoryInsight.recommended_next_actions,
          }
        : null,
  };

  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

export function buildEventIntelligenceOverview(
  source: EventIntelligenceSource,
): EventIntelligenceOverview {
  const startedAt = new Date(source.event.started_at).getTime();
  const endedAt = source.event.ended_at
    ? new Date(source.event.ended_at).getTime()
    : Number.NaN;
  const durationMinutes =
    Number.isFinite(startedAt) && Number.isFinite(endedAt)
      ? Math.max(0, Math.round((endedAt - startedAt) / 60_000))
      : null;

  return {
    event_id: source.event.id,
    event_name: source.event.name?.trim() || "Untitled event",
    event_location: source.event.location?.trim() || "",
    started_at: source.event.started_at,
    ended_at: source.event.ended_at,
    duration_minutes: durationMinutes,
    conversation_count: source.transcripts.length,
    people_count: source.people.length,
  };
}

export async function persistEventIntelligence(
  supabase: SupabaseClient,
  source: EventIntelligenceSource,
  report: EventIntelligenceReport,
): Promise<StoredEventIntelligence> {
  const generatedAt = new Date().toISOString();
  const intelligence: StoredEventIntelligence = {
    schema_version: 1,
    generated_at: generatedAt,
    source_fingerprint: buildSourceFingerprint(source),
    report,
  };
  const baseInsight = source.insights[0] ?? source.memoryInsight ?? null;
  const existingRawJson =
    baseInsight?.raw_json && isObject(baseInsight.raw_json)
      ? baseInsight.raw_json
      : {};
  const memoryRawJson =
    source.memoryInsight?.raw_json && isObject(source.memoryInsight.raw_json)
      ? source.memoryInsight.raw_json
      : {};
  const insightValues = {
    summary: report.summary,
    key_topics: report.topics,
    patterns: report.patterns.map((item) => item.pattern),
    recommended_next_actions: report.follow_up_queue.map(
      (item) => item.action,
    ),
    raw_json: {
      ...existingRawJson,
      ...memoryRawJson,
      event_intelligence: intelligence,
    },
  };

  const result = baseInsight
    ? await supabase
        .from("event_insights")
        .update(insightValues)
        .eq("id", baseInsight.id)
        .select("id")
        .single()
    : await supabase
        .from("event_insights")
        .insert({
          event_id: source.event.id,
          ...insightValues,
          missed_opportunities: [],
        })
        .select("id")
        .single();

  if (result.error) {
    throw databaseError(
      `Could not save Event Intelligence: ${result.error.message}`,
    );
  }

  return storedEventIntelligenceSchema.parse(intelligence);
}
