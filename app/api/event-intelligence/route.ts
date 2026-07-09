import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z, ZodError } from "zod";

import { generateEventIntelligence } from "@/lib/intelligence/generate-event-intelligence";
import { normalizeEventIntelligenceReport } from "@/lib/intelligence/normalize-report";
import type { EventIntelligenceReport } from "@/lib/intelligence/schema";
import {
  assertIntelligenceEvidence,
  buildEventIntelligenceOverview,
  buildSourceFingerprint,
  EventIntelligenceServiceError,
  findStoredEventIntelligence,
  loadEventIntelligenceSource,
  persistEventIntelligence,
  type EventIntelligenceSource,
  type StoredReportMatch,
} from "@/lib/services/event-intelligence-service";
import {
  ApiAuthenticationError,
  authenticateApiRequest,
  type AuthenticatedApiContext,
} from "@/lib/supabase/api-auth";
import type {
  EventIntelligenceError,
  EventIntelligenceResponse,
} from "@/types/event-intelligence";

export const runtime = "nodejs";
export const maxDuration = 90;

const requestSchema = z.object({
  eventId: z.string().uuid(),
  regenerate: z.boolean().optional().default(false),
});

interface ActiveReportJob {
  regenerate: boolean;
  promise: Promise<EventIntelligenceResponse>;
}

const activeReports = new Map<string, ActiveReportJob>();

function storedResponse(
  stored: StoredReportMatch,
  intelligenceSource: EventIntelligenceSource,
  overview: EventIntelligenceResponse["overview"],
  source: "stored" | "fallback",
  warning?: string,
): EventIntelligenceResponse {
  return {
    overview,
    report: normalizeEventIntelligenceReport({
      report: stored.intelligence.report,
      people: intelligenceSource.people,
      transcripts: intelligenceSource.transcripts,
      eventInsight: intelligenceSource.memoryInsight,
    }),
    generated_at: stored.intelligence.generated_at,
    source,
    warning,
  };
}

async function processEventIntelligence(
  supabase: SupabaseClient,
  eventId: string,
  regenerate: boolean,
): Promise<EventIntelligenceResponse> {
  const source = await loadEventIntelligenceSource(supabase, eventId);
  const overview = buildEventIntelligenceOverview(source);
  const stored = findStoredEventIntelligence(source.insights);
  const sourceFingerprint = buildSourceFingerprint(source);

  if (
    stored &&
    !regenerate &&
    stored.intelligence.source_fingerprint === sourceFingerprint
  ) {
    return storedResponse(stored, source, overview, "stored");
  }

  try {
    assertIntelligenceEvidence(source);
  } catch (error) {
    if (stored) {
      return storedResponse(
        stored,
        source,
        overview,
        "fallback",
        "Echo kept the previously saved report because event memory is not ready to reanalyse.",
      );
    }
    throw error;
  }

  let report: EventIntelligenceReport;
  try {
    report = await generateEventIntelligence({
      event: source.event,
      people: source.people,
      eventInsight: source.memoryInsight,
      transcripts: source.transcripts,
    });
    report = normalizeEventIntelligenceReport({
      report,
      people: source.people,
      transcripts: source.transcripts,
      eventInsight: source.memoryInsight,
    });
  } catch (error) {
    if (stored) {
      return storedResponse(
        stored,
        source,
        overview,
        "fallback",
        "OpenAI is temporarily unavailable, so Echo loaded the previously saved report.",
      );
    }

    if (error instanceof ZodError) {
      throw new EventIntelligenceServiceError(
        "Echo received an incomplete intelligence report. Please retry.",
        "validation_failed",
        502,
      );
    }

    console.warn(
      "Event Intelligence generation unavailable:",
      error instanceof Error ? error.message : "Unknown OpenAI error",
    );
    throw new EventIntelligenceServiceError(
      "Echo could not analyse this event right now. Please retry.",
      "openai_failed",
      502,
    );
  }

  try {
    const persisted = await persistEventIntelligence(supabase, source, report);
    return {
      overview,
      report: persisted.report,
      generated_at: persisted.generated_at,
      source: "generated",
    };
  } catch (error) {
    if (stored) {
      return storedResponse(
        stored,
        source,
        overview,
        "fallback",
        "Supabase could not save the refreshed analysis, so Echo kept the previously saved report.",
      );
    }
    throw error;
  }
}

function scheduleEventIntelligence(
  supabase: SupabaseClient,
  jobKey: string,
  eventId: string,
  regenerate: boolean,
): Promise<EventIntelligenceResponse> {
  const current = activeReports.get(jobKey);

  if (current && (!regenerate || current.regenerate)) {
    return current.promise;
  }

  const promise = current
    ? current.promise
        .catch(() => undefined)
        .then(() => processEventIntelligence(supabase, eventId, true))
    : processEventIntelligence(supabase, eventId, regenerate);

  activeReports.set(jobKey, { regenerate, promise });
  const clearJob = () => {
    if (activeReports.get(jobKey)?.promise === promise) {
      activeReports.delete(jobKey);
    }
  };
  void promise.then(clearJob, clearJob);

  return promise;
}

export async function POST(request: Request) {
  let eventId: string;
  let regenerate: boolean;
  let auth: AuthenticatedApiContext;

  try {
    auth = await authenticateApiRequest(request);
  } catch (error) {
    return NextResponse.json<EventIntelligenceError>(
      {
        error:
          error instanceof ApiAuthenticationError
            ? error.message
            : "Sign in before generating Event Intelligence.",
        code: "unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const body = requestSchema.parse(await request.json());
    eventId = body.eventId;
    regenerate = body.regenerate;
  } catch {
    return NextResponse.json<EventIntelligenceError>(
      {
        error: "A valid event ID is required.",
        code: "invalid_request",
      },
      { status: 400 },
    );
  }

  const jobKey = `${auth.user.id}:${eventId}`;
  const job = scheduleEventIntelligence(
    auth.supabase,
    jobKey,
    eventId,
    regenerate,
  );

  try {
    return NextResponse.json<EventIntelligenceResponse>(await job);
  } catch (error) {
    const serviceError =
      error instanceof EventIntelligenceServiceError
        ? error
        : new EventIntelligenceServiceError(
            "Echo could not prepare Event Intelligence.",
            "database_error",
            500,
          );

    console.error("Event Intelligence pipeline failed:", serviceError.message);
    return NextResponse.json<EventIntelligenceError>(
      {
        error: serviceError.message,
        code: serviceError.code,
      },
      { status: serviceError.status },
    );
  }
}
