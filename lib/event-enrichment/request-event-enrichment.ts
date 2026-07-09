import type {
  EnrichEventResponse,
  EventClue,
} from "@/types/event-lifecycle";
import { getCurrentAccessToken } from "@/lib/supabase/access-token";

export async function requestEventEnrichment(
  clue: EventClue,
  image?: File,
): Promise<EnrichEventResponse> {
  const accessToken = await getCurrentAccessToken();
  const formData = new FormData();
  formData.set("type", clue.type);

  if (clue.type === "image" && image) {
    formData.set("image", image);
  } else {
    formData.set("clue", clue.value);
  }

  const response = await fetch("/api/event-enrichment", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  const payload = (await response.json()) as
    | EnrichEventResponse
    | { error?: string };

  if (!response.ok || !("draft" in payload)) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Echo could not enrich this event.",
    );
  }

  return payload;
}
