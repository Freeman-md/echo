import type {
  EventIntelligenceError,
  EventIntelligenceErrorCode,
  EventIntelligenceResponse,
} from "@/types/event-intelligence";

export class EventIntelligenceRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: EventIntelligenceErrorCode,
  ) {
    super(message);
    this.name = "EventIntelligenceRequestError";
  }
}

const inFlightRequests = new Map<
  string,
  Promise<EventIntelligenceResponse>
>();

function isErrorResponse(value: unknown): value is EventIntelligenceError {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EventIntelligenceError>;
  return typeof candidate.error === "string";
}

function isSuccessResponse(
  value: unknown,
): value is EventIntelligenceResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EventIntelligenceResponse>;
  return (
    Boolean(candidate.overview) &&
    Boolean(candidate.report) &&
    typeof candidate.generated_at === "string" &&
    (candidate.source === "generated" ||
      candidate.source === "stored" ||
      candidate.source === "fallback")
  );
}

async function makeRequest(
  eventId: string,
  regenerate: boolean,
): Promise<EventIntelligenceResponse> {
  const response = await fetch("/api/event-intelligence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, regenerate }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok || !isSuccessResponse(payload)) {
    const error = isErrorResponse(payload) ? payload : null;
    throw new EventIntelligenceRequestError(
      error?.error ?? "Echo could not prepare Event Intelligence.",
      error?.code,
    );
  }

  return payload;
}

export function requestEventIntelligence(
  eventId: string,
  regenerate = false,
): Promise<EventIntelligenceResponse> {
  const requestKey = `${eventId}:${regenerate ? "refresh" : "default"}`;
  const existing = inFlightRequests.get(requestKey);
  if (existing) return existing;

  const request = makeRequest(eventId, regenerate).finally(() => {
    inFlightRequests.delete(requestKey);
  });
  inFlightRequests.set(requestKey, request);
  return request;
}
