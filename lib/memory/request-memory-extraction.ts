import type {
  EventMemoryError,
  EventMemoryResponse,
} from "@/types/memory";
import { getCurrentSession } from "@/lib/supabase/access-token";

const inFlightRequests = new Map<string, Promise<EventMemoryResponse>>();

export class EventMemoryRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: EventMemoryError["code"],
  ) {
    super(message);
    this.name = "EventMemoryRequestError";
  }
}

interface MemoryExtractionOptions {
  forceRefresh?: boolean;
}

async function makeRequest(
  eventId: string,
  options: MemoryExtractionOptions,
  accessToken: string,
): Promise<EventMemoryResponse> {
  const response = await fetch("/api/memory-extraction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      eventId,
      forceRefresh: options.forceRefresh ?? false,
    }),
  });
  const payload = (await response.json()) as
    | EventMemoryResponse
    | EventMemoryError;

  if (!response.ok || "error" in payload) {
    throw new EventMemoryRequestError(
      "error" in payload ? payload.error : "Echo could not process this event.",
      "code" in payload ? payload.code : undefined,
    );
  }

  return payload;
}

export async function requestMemoryExtraction(
  eventId: string,
  options: MemoryExtractionOptions = {},
): Promise<EventMemoryResponse> {
  const session = await getCurrentSession().catch(() => {
    throw new EventMemoryRequestError(
      "Sign in before generating event memories.",
      "unauthorized",
    );
  });
  const requestKey = `${session.user.id}:${eventId}:${
    options.forceRefresh ? "refresh" : "load"
  }`;
  const existing = inFlightRequests.get(requestKey);
  if (existing) return existing;

  const request = makeRequest(eventId, options, session.access_token).finally(
    () => {
    inFlightRequests.delete(requestKey);
    },
  );
  inFlightRequests.set(requestKey, request);
  return request;
}
