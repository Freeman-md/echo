import type {
  EventMemoryError,
  EventMemoryResponse,
} from "@/types/memory";

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

async function makeRequest(eventId: string): Promise<EventMemoryResponse> {
  const response = await fetch("/api/memory-extraction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId }),
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

export function requestMemoryExtraction(
  eventId: string,
): Promise<EventMemoryResponse> {
  const existing = inFlightRequests.get(eventId);
  if (existing) return existing;

  const request = makeRequest(eventId).finally(() => {
    inFlightRequests.delete(eventId);
  });
  inFlightRequests.set(eventId, request);
  return request;
}
