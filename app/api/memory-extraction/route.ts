import { NextResponse } from "next/server";
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
import type {
  EventMemoryError,
  EventMemoryResponse,
} from "@/types/memory";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  eventId: z.string().uuid(),
});

const activeExtractions = new Map<string, Promise<EventMemoryResponse>>();

async function processEventMemory(
  eventId: string,
): Promise<EventMemoryResponse> {
  const persisted = await loadPersistedEventMemory(eventId);
  const existingExtraction = extractionFromPersistedMemory(persisted);

  if (existingExtraction && persisted.eventInsight) {
    const repaired =
      persisted.people.length === 0
        ? await repairPeopleFromCheckpoint(
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

  const source = await loadMemorySource(eventId);
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
    eventId,
    memory,
    persisted.people,
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

  try {
    const body = requestSchema.parse(await request.json());
    eventId = body.eventId;
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
  const existingJob = activeExtractions.get(eventId);
  const job = existingJob ?? processEventMemory(eventId);
  if (!existingJob) activeExtractions.set(eventId, job);

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
    if (!existingJob) activeExtractions.delete(eventId);
  }
}
