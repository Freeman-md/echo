import { z } from "zod";

export const eventEnrichmentSchema = z.object({
  event_name: z
    .string()
    .describe("The supported event name, or an empty string if unknown."),
  organiser: z
    .string()
    .describe("The supported organiser name, or an empty string if unknown."),
  location: z
    .string()
    .describe("Venue, city, or online location, or an empty string if unknown."),
  date: z
    .string()
    .describe("A human-readable event date/time, or an empty string if unknown."),
  event_type: z
    .string()
    .describe("A concise event category, or an empty string if uncertain."),
  summary: z
    .string()
    .describe("A concise evidence-grounded summary of the event."),
  technologies: z
    .array(z.string())
    .describe("Technologies or topics explicitly supported by the evidence."),
  sponsors: z
    .array(z.string())
    .describe("Sponsors explicitly supported by the evidence."),
  agenda: z
    .array(z.string())
    .describe("Agenda items explicitly supported by the evidence."),
  likely_attendees: z
    .array(z.string())
    .describe("Cautious descriptions of likely attendee groups."),
  recommended_focus: z
    .array(z.string())
    .describe("Useful networking themes grounded in the event."),
  conversation_tips: z
    .array(z.string())
    .describe("Short, practical conversation suggestions for this event."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall evidence confidence from 0 to 1."),
});

export type EventEnrichmentResult = z.infer<typeof eventEnrichmentSchema>;
