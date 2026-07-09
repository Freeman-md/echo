import { z } from "zod";

const intelligenceMetricsSchema = z.object({
  conversations: z.number().int().nonnegative(),
  people_remembered: z.number().int().nonnegative(),
  topics_discussed: z.number().int().nonnegative(),
  companies_mentioned: z.number().int().nonnegative(),
  technologies_mentioned: z.number().int().nonnegative(),
  recommended_follow_ups: z.number().int().nonnegative(),
  high_priority_people: z.number().int().nonnegative(),
});

const intelligenceMetricsOutputSchema = z.object({
  conversations: z.number(),
  people_remembered: z.number(),
  topics_discussed: z.number(),
  companies_mentioned: z.number(),
  technologies_mentioned: z.number(),
  recommended_follow_ups: z.number(),
  high_priority_people: z.number(),
});

const roomPatternSchema = z.object({
  pattern: z.string().describe("A concise recurring event-level pattern."),
  evidence: z
    .string()
    .describe("A brief explanation grounded in the supplied event evidence."),
});

const priorityPersonSchema = z.object({
  person_id: z
    .string()
    .describe("The exact ID of a person supplied in the evidence."),
  name: z.string().describe("The supplied name for this person."),
  why_they_matter: z
    .string()
    .describe("A grounded reason this connection deserves attention."),
  reconnect_priority: z.enum(["high", "medium", "low"]),
  suggested_next_action: z
    .string()
    .describe("One concrete, evidence-based next action."),
});

const followUpItemSchema = z.object({
  person_id: z
    .string()
    .nullable()
    .describe("A supplied person ID, or null for an event-level action."),
  person_name: z
    .string()
    .nullable()
    .describe("The supplied person name, or null for an event-level action."),
  action: z.string().describe("A specific action the user can take."),
  timing: z.enum(["within_24_hours", "this_week", "when_relevant"]),
  reason: z.string().describe("Why this action is worthwhile."),
});

const timelineItemSchema = z.object({
  sequence: z.number().int().nonnegative(),
  transcript_id: z
    .string()
    .nullable()
    .describe("The supporting transcript ID, or null when order is estimated."),
  occurred_at: z
    .string()
    .nullable()
    .describe("The supplied transcript timestamp, or null when unavailable."),
  time_label: z
    .string()
    .describe("A concise display time, or 'Order estimated' when unavailable."),
  title: z.string().describe("A short description of this conversation moment."),
  summary: z.string().describe("A grounded one-sentence account of the moment."),
  person_ids: z
    .array(z.string())
    .describe("Only supplied person IDs relevant to this moment."),
});

const timelineItemOutputSchema = timelineItemSchema.extend({
  sequence: z.number(),
});

export const eventIntelligenceOutputSchema = z.object({
  summary: z
    .string()
    .describe("A concise executive summary of the event as a whole."),
  patterns: z.array(roomPatternSchema),
  metrics: intelligenceMetricsOutputSchema,
  priority_people: z.array(priorityPersonSchema),
  follow_up_queue: z.array(followUpItemSchema),
  timeline: z.array(timelineItemOutputSchema),
  topics: z.array(z.string()),
  companies: z.array(z.string()),
  technologies: z.array(z.string()),
  overall_confidence: z.number(),
});

export const eventIntelligenceReportSchema = z.object({
  summary: z
    .string()
    .describe("A concise executive summary of the event as a whole."),
  patterns: z.array(roomPatternSchema).max(10),
  metrics: intelligenceMetricsSchema,
  priority_people: z.array(priorityPersonSchema).max(12),
  follow_up_queue: z.array(followUpItemSchema).max(16),
  timeline: z.array(timelineItemSchema).max(20),
  topics: z.array(z.string()).max(24),
  companies: z.array(z.string()).max(24),
  technologies: z.array(z.string()).max(24),
  overall_confidence: z.number().min(0).max(1),
});

export const storedEventIntelligenceSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  source_fingerprint: z.string().optional(),
  report: eventIntelligenceReportSchema,
});

export type EventIntelligenceReport = z.infer<
  typeof eventIntelligenceReportSchema
>;
export type StoredEventIntelligence = z.infer<
  typeof storedEventIntelligenceSchema
>;
