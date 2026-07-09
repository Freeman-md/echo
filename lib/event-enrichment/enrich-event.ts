import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";

import {
  eventEnrichmentSchema,
  type EventEnrichmentResult,
} from "@/lib/event-enrichment/schema";
import { getOpenAIClient } from "@/lib/openai/client";
import {
  buildEventEnrichmentPrompt,
  EVENT_ENRICHMENT_SYSTEM_PROMPT,
} from "@/lib/prompts/event-enrichment";
import type { EventClueType } from "@/types/event-lifecycle";

export const EVENT_ENRICHMENT_MODEL = "gpt-5.4-mini";

interface EnrichEventInput {
  clueType: EventClueType;
  clue: string;
  pageContent?: string;
  pageFetchWarning?: string;
  imageDataUrl?: string;
}

export async function enrichEvent({
  clueType,
  clue,
  pageContent,
  pageFetchWarning,
  imageDataUrl,
}: EnrichEventInput): Promise<EventEnrichmentResult> {
  const content: ResponseInputContent[] = [
    {
      type: "input_text",
      text: buildEventEnrichmentPrompt({
        clueType,
        clue,
        pageContent,
        pageFetchWarning,
      }),
    },
  ];

  if (imageDataUrl) {
    content.push({
      type: "input_image",
      image_url: imageDataUrl,
      detail: "high",
    });
  }

  const response = await getOpenAIClient().responses.parse({
    model: EVENT_ENRICHMENT_MODEL,
    instructions: EVENT_ENRICHMENT_SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content,
      },
    ],
    text: {
      format: zodTextFormat(eventEnrichmentSchema, "event_enrichment"),
    },
    reasoning: {
      effort: "low",
    },
    max_output_tokens: 1_800,
    store: false,
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI did not return a structured event profile.");
  }

  return response.output_parsed;
}
