import "server-only";

import {
  toEventInsightRow,
  toPersonRows,
  personFromRow,
} from "@/lib/memory/map-memory";
import { memoryExtractionSchema } from "@/lib/memory/schema";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { Event, EventInsight, PersonMemory, Transcript } from "@/types";
import type {
  EventMemoryError,
  MemoryExtraction,
} from "@/types/memory";

const MAX_TRANSCRIPT_CHARACTERS = 80_000;

export class MemoryServiceError extends Error {
  constructor(
    message: string,
    public readonly code: EventMemoryError["code"],
    public readonly status: number,
  ) {
    super(message);
    this.name = "MemoryServiceError";
  }
}

export interface MemorySource {
  event: Pick<Event, "id" | "name" | "location" | "context" | "status">;
  transcript: string;
}

export interface PersistedEventMemory {
  people: PersonMemory[];
  eventInsight: EventInsight | null;
}

function databaseError(message: string): MemoryServiceError {
  return new MemoryServiceError(message, "database_error", 500);
}

export async function loadMemorySource(
  eventId: string,
): Promise<MemorySource> {
  const supabase = getServerSupabaseClient();
  const [eventResult, transcriptResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,location,context,status")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("transcripts")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  if (eventResult.error) {
    throw databaseError(`Could not load event: ${eventResult.error.message}`);
  }
  if (!eventResult.data) {
    throw new MemoryServiceError(
      "This event could not be found.",
      "event_not_found",
      404,
    );
  }
  if (eventResult.data.status !== "completed") {
    throw new MemoryServiceError(
      "Finish the event before extracting its memories.",
      "event_not_completed",
      409,
    );
  }
  if (transcriptResult.error) {
    throw databaseError(
      `Could not load transcript: ${transcriptResult.error.message}`,
    );
  }

  const transcripts = (transcriptResult.data ?? []) as Transcript[];
  const transcript = transcripts
    .map((item) => item.raw_text.trim())
    .filter(Boolean)
    .join("\n\n--- Conversation segment ---\n\n")
    .slice(0, MAX_TRANSCRIPT_CHARACTERS);

  if (!transcript) {
    throw new MemoryServiceError(
      "No transcript is available for this event yet.",
      "no_transcript",
      409,
    );
  }

  return {
    event: eventResult.data as MemorySource["event"],
    transcript,
  };
}

export async function loadPersistedEventMemory(
  eventId: string,
): Promise<PersistedEventMemory> {
  const supabase = getServerSupabaseClient();
  const [peopleResult, insightResult] = await Promise.all([
    supabase
      .from("people")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("event_insights")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (peopleResult.error) {
    throw databaseError(
      `Could not load people memories: ${peopleResult.error.message}`,
    );
  }
  if (insightResult.error) {
    throw databaseError(
      `Could not load event insight: ${insightResult.error.message}`,
    );
  }

  return {
    people: (peopleResult.data ?? []) as PersonMemory[],
    eventInsight: (insightResult.data as EventInsight | null) ?? null,
  };
}

export function extractionFromPersistedMemory(
  persisted: PersistedEventMemory,
): MemoryExtraction | null {
  if (!persisted.eventInsight) return null;

  const checkpoint = memoryExtractionSchema.safeParse(
    persisted.eventInsight.raw_json,
  );
  if (checkpoint.success) return checkpoint.data;

  const people = persisted.people.map(personFromRow);
  const averageConfidence =
    people.length > 0
      ? people.reduce((sum, person) => sum + person.confidence, 0) /
        people.length
      : 0;

  return {
    people,
    event_insight: {
      event_summary: persisted.eventInsight.summary ?? "",
      topics: persisted.eventInsight.key_topics ?? [],
      patterns: persisted.eventInsight.patterns ?? [],
      conversation_highlights: [],
      recommended_actions:
        persisted.eventInsight.recommended_next_actions ?? [],
      overall_confidence: averageConfidence,
    },
  };
}

export async function persistExtractedMemory(
  eventId: string,
  memory: MemoryExtraction,
  existingPeople: PersonMemory[] = [],
): Promise<PersistedEventMemory> {
  const supabase = getServerSupabaseClient();
  const insightRow = toEventInsightRow(eventId, memory);
  const { data: insight, error: insightError } = await supabase
    .from("event_insights")
    .insert(insightRow)
    .select("*")
    .single();

  if (insightError) {
    throw databaseError(
      `Could not save event insight: ${insightError.message}`,
    );
  }

  let people = existingPeople;
  if (people.length === 0 && memory.people.length > 0) {
    const { data, error } = await supabase
      .from("people")
      .insert(toPersonRows(eventId, memory))
      .select("*");

    if (error) {
      throw databaseError(
        `Event insight was saved, but people memories need retrying: ${error.message}`,
      );
    }
    people = (data ?? []) as PersonMemory[];
  }

  return {
    people,
    eventInsight: insight as EventInsight,
  };
}

export async function repairPeopleFromCheckpoint(
  eventId: string,
  memory: MemoryExtraction,
  eventInsight: EventInsight,
): Promise<PersistedEventMemory> {
  if (memory.people.length === 0) {
    return { people: [], eventInsight };
  }

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("people")
    .insert(toPersonRows(eventId, memory))
    .select("*");

  if (error) {
    throw databaseError(`Could not restore people memories: ${error.message}`);
  }

  return {
    people: (data ?? []) as PersonMemory[],
    eventInsight,
  };
}
