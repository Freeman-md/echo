import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z, ZodError } from "zod";

import { extractMemory } from "@/lib/memory/extract-memory";
import {
  extractionFromPersistedMemory,
  loadMemorySource,
  loadPersistedEventMemory,
  MemoryServiceError,
  persistExtractedMemory,
  repairPeopleFromCheckpoint,
} from "@/lib/services/memory-service";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type {
  EventMemoryError,
  EventMemoryResponse,
} from "@/types/memory";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  eventId: z.string().uuid(),
  forceRefresh: z.boolean().optional().default(false),
});

const activeExtractions = new Map<string, Promise<EventMemoryResponse>>();

async function processEventMemory(
  supabase: SupabaseClient,
  eventId: string,
  forceRefresh: boolean,
): Promise<EventMemoryResponse> {
  const persisted = await loadPersistedEventMemory(supabase, eventId);
  const existingExtraction = extractionFromPersistedMemory(persisted);

  if (!forceRefresh && existingExtraction && persisted.eventInsight) {
    const repaired =
      persisted.people.length === 0
        ? await repairPeopleFromCheckpoint(
            supabase,
            eventId,
            existingExtraction,
            persisted.eventInsight,
          )
        : persisted;

    return {
      memory: existingExtraction,
      people: repaired.people,
      eventInsight: persisted.eventInsight,
      reused: true,
    };
  }

  const source = await loadMemorySource(supabase, eventId);
  let memory;

  try {
    memory = await extractMemory({
      eventName: source.event.name ?? "",
      eventLocation: source.event.location ?? "",
      eventContext: source.event.context ?? "",
      transcript: source.transcript,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new MemoryServiceError(
        "Echo received an incomplete memory result. Please retry.",
        "validation_failed",
        502,
      );
    }

    console.warn(
      "Memory extraction unavailable:",
      error instanceof Error ? error.message : "Unknown OpenAI error",
    );
    throw new MemoryServiceError(
      "Echo could not extract memories right now. Please retry.",
      "openai_failed",
      502,
    );
  }

  const saved = await persistExtractedMemory(
    supabase,
    eventId,
    memory,
    persisted.people,
    forceRefresh,
  );

  if (!saved.eventInsight) {
    throw new MemoryServiceError(
      "Echo could not save the event insight.",
      "database_error",
      500,
    );
  }

  return {
    memory,
    people: saved.people,
    eventInsight: saved.eventInsight,
    reused: false,
  };
}

export async function POST(request: Request) {
  let eventId: string;
  let forceRefresh: boolean;

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json<EventMemoryError>(
      {
        error: "Sign in before generating event memories.",
        code: "unauthorized",
      },
      { status: 401 },
    );
  }

  const supabase = getServerSupabaseClient(accessToken);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return NextResponse.json<EventMemoryError>(
      {
        error: "Your session has expired. Sign in again.",
        code: "unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const body = requestSchema.parse(await request.json());
    eventId = body.eventId;
    forceRefresh = body.forceRefresh;
  } catch {
    return NextResponse.json<EventMemoryError>(
      {
        error: "A valid event ID is required.",
        code: "invalid_request",
      },
      { status: 400 },
    );
  }

  // Coalesce duplicate requests from React Strict Mode or quick repeated taps.
  const jobKey = `${user.id}:${eventId}:${forceRefresh ? "refresh" : "load"}`;
  const existingJob = activeExtractions.get(jobKey);
  const job =
    existingJob ?? processEventMemory(supabase, eventId, forceRefresh);
  if (!existingJob) activeExtractions.set(jobKey, job);

  try {
    return NextResponse.json<EventMemoryResponse>(await job);
  } catch (error) {
    const serviceError =
      error instanceof MemoryServiceError
        ? error
        : new MemoryServiceError(
            "Echo could not process this memory.",
            "database_error",
            500,
          );

    console.error("Memory pipeline failed:", serviceError.message);
    return NextResponse.json<EventMemoryError>(
      {
        error: serviceError.message,
        code: serviceError.code,
      },
      { status: serviceError.status },
    );
  } finally {
    if (!existingJob) activeExtractions.delete(jobKey);
  }
}
