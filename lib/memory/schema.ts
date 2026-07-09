import { z } from "zod";

export const extractedPersonMemorySchema = z.object({
  name: z
    .string()
    .describe("The person's name, or an empty string when not stated."),
  company: z
    .string()
    .describe("The person's company, or an empty string when not stated."),
  role: z
    .string()
    .describe("The person's role, or an empty string when not stated."),
  confidence: z.number().min(0).max(1),
  technologies: z.array(z.string()),
  topics: z.array(z.string()),
  interests: z.array(z.string()),
  career_interests: z.array(z.string()),
  projects: z.array(z.string()),
  memorable_details: z.array(z.string()),
  conversation_highlights: z.array(z.string()),
  collaboration_opportunities: z.array(z.string()),
  conversation_summary: z.string(),
  follow_up: z.string(),
  reconnect_priority: z.enum(["high", "medium", "low", "unknown"]),
});

export const extractedEventInsightSchema = z.object({
  event_summary: z.string(),
  topics: z.array(z.string()),
  patterns: z.array(z.string()),
  conversation_highlights: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  overall_confidence: z.number().min(0).max(1),
});

export const memoryExtractionSchema = z.object({
  people: z.array(extractedPersonMemorySchema),
  event_insight: extractedEventInsightSchema,
});

export type ValidatedMemoryExtraction = z.infer<
  typeof memoryExtractionSchema
>;
