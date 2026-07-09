import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import {
  eventIntelligenceReportSchema,
  type EventIntelligenceReport,
} from "@/lib/intelligence/schema";
import { getOpenAIClient } from "@/lib/openai/client";
import {
  buildEventIntelligencePrompt,
  EVENT_INTELLIGENCE_SYSTEM_PROMPT,
} from "@/lib/prompts/event-intelligence";
import type { Event, EventInsight, PersonMemory, Transcript } from "@/types";

export const EVENT_INTELLIGENCE_MODEL = "gpt-5.6";

interface GenerateEventIntelligenceInput {
  event: Pick<
    Event,
    | "id"
    | "name"
    | "location"
    | "context"
    | "started_at"
    | "ended_at"
  >;
  people: PersonMemory[];
  eventInsight: EventInsight | null;
  transcripts: Transcript[];
}

export async function generateEventIntelligence(
  input: GenerateEventIntelligenceInput,
): Promise<EventIntelligenceReport> {
  const response = await getOpenAIClient().responses.parse(
    {
      model: EVENT_INTELLIGENCE_MODEL,
      instructions: EVENT_INTELLIGENCE_SYSTEM_PROMPT,
      input: buildEventIntelligencePrompt(input),
      text: {
        format: zodTextFormat(
          eventIntelligenceReportSchema,
          "event_intelligence",
        ),
      },
      reasoning: {
        effort: "medium",
      },
      max_output_tokens: 10_000,
      store: false,
    },
    {
      timeout: 75_000,
      maxRetries: 0,
    },
  );

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured Event Intelligence report.");
  }

  return eventIntelligenceReportSchema.parse(response.output_parsed);
}
