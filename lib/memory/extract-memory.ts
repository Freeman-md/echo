import "server-only";

import { zodTextFormat } from "openai/helpers/zod";

import {
  memoryExtractionSchema,
  type ValidatedMemoryExtraction,
} from "@/lib/memory/schema";
import { getOpenAIClient } from "@/lib/openai/client";
import {
  buildMemoryExtractionPrompt,
  MEMORY_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/prompts/memory-extraction";

export const MEMORY_EXTRACTION_MODEL = "gpt-5.4-mini";

interface ExtractMemoryInput {
  eventName: string;
  eventLocation: string;
  eventContext: string;
  transcript: string;
}

export async function extractMemory({
  eventName,
  eventLocation,
  eventContext,
  transcript,
}: ExtractMemoryInput): Promise<ValidatedMemoryExtraction> {
  const response = await getOpenAIClient().responses.parse({
    model: MEMORY_EXTRACTION_MODEL,
    instructions: MEMORY_EXTRACTION_SYSTEM_PROMPT,
    input: buildMemoryExtractionPrompt({
      eventName,
      eventLocation,
      eventContext,
      transcript,
    }),
    text: {
      format: zodTextFormat(memoryExtractionSchema, "networking_memory"),
    },
    reasoning: {
      effort: "medium",
    },
    max_output_tokens: 6_000,
    store: false,
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured networking memory.");
  }

  return memoryExtractionSchema.parse(response.output_parsed);
}
