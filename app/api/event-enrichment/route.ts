import { NextResponse } from "next/server";

import { buildEnrichedEventDraft } from "@/lib/event-enrichment/build-event-draft";
import { enrichEvent } from "@/lib/event-enrichment/enrich-event";
import { inferEventDraft, isEventUrl } from "@/lib/events/infer-event-draft";
import { fetchEventPage } from "@/lib/fetch-page/fetch-event-page";
import {
  ApiAuthenticationError,
  authenticateApiRequest,
} from "@/lib/supabase/api-auth";
import type {
  EnrichEventResponse,
  EventClue,
  EventClueType,
} from "@/types/event-lifecycle";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function fallbackResponse(
  clue: EventClue,
  warning: string,
): NextResponse<EnrichEventResponse> {
  return NextResponse.json({
    draft: {
      ...inferEventDraft(clue),
      enrichmentSource: "fallback",
      enrichmentWarning: warning,
    },
    source: "fallback",
    warning,
  });
}

function parseTextClue(type: EventClueType, value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Add an event clue before asking Echo to enrich it.");
  }

  const clue: EventClue = {
    type,
    value: value.trim().slice(0, 2_000),
  };

  if (type === "url" && !isEventUrl(clue.value)) {
    throw new Error("Enter a complete public event URL.");
  }

  return clue;
}

export async function POST(request: Request) {
  let clue: EventClue;
  let imageDataUrl: string | undefined;

  try {
    await authenticateApiRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiAuthenticationError
            ? error.message
            : "Sign in before enriching an event.",
      },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const rawType = formData.get("type");

    if (rawType !== "text" && rawType !== "url" && rawType !== "image") {
      return NextResponse.json(
        { error: "Unsupported event clue type." },
        { status: 400 },
      );
    }

    if (rawType === "image") {
      const image = formData.get("image");

      if (!(image instanceof File) || image.size === 0) {
        return NextResponse.json(
          { error: "Choose an event screenshot first." },
          { status: 400 },
        );
      }

      clue = {
        type: "image",
        value: image.name,
        fileName: image.name,
        fileType: image.type,
        fileSize: image.size,
      };

      if (
        image.size > MAX_IMAGE_BYTES ||
        !SUPPORTED_IMAGE_TYPES.has(image.type)
      ) {
        return fallbackResponse(
          clue,
          image.size > MAX_IMAGE_BYTES
            ? "This screenshot is over 4 MB, so Echo used its filename for the draft."
            : "This image format is not supported for vision, so Echo used its filename for the draft.",
        );
      }

      const imageBytes = Buffer.from(await image.arrayBuffer());
      imageDataUrl = `data:${image.type};base64,${imageBytes.toString("base64")}`;
    } else {
      clue = parseTextClue(rawType, formData.get("clue"));
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Echo could not read this event clue.",
      },
      { status: 400 },
    );
  }

  let pageContent: string | undefined;
  let pageFetchWarning: string | undefined;

  if (clue.type === "url") {
    try {
      const page = await fetchEventPage(clue.value);
      pageContent = page.content;
    } catch (error) {
      pageFetchWarning =
        error instanceof Error
          ? error.message
          : "The event page could not be read.";
    }
  }

  try {
    const enrichment = await enrichEvent({
      clueType: clue.type,
      clue: clue.value,
      pageContent,
      pageFetchWarning,
      imageDataUrl,
    });
    const warning = pageFetchWarning
      ? "Echo could not read the event page, so this draft relies on the URL and may be less certain."
      : undefined;

    return NextResponse.json<EnrichEventResponse>({
      draft: buildEnrichedEventDraft(clue, enrichment, warning),
      source: "ai",
      warning,
    });
  } catch (error) {
    console.warn(
      "Event enrichment unavailable:",
      error instanceof Error ? error.message : "Unknown enrichment error",
    );
    return fallbackResponse(
      clue,
      "AI enrichment is temporarily unavailable, so Echo created a quick draft from your original clue.",
    );
  }
}
