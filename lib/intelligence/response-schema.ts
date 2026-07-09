import { z } from "zod";

import { eventIntelligenceReportSchema } from "@/lib/intelligence/schema";

export const eventIntelligenceResponseSchema = z.object({
  overview: z.object({
    event_id: z.string(),
    event_name: z.string(),
    event_location: z.string(),
    started_at: z.string(),
    ended_at: z.string().nullable(),
    duration_minutes: z.number().int().nonnegative().nullable(),
    conversation_count: z.number().int().nonnegative(),
    people_count: z.number().int().nonnegative(),
  }),
  report: eventIntelligenceReportSchema,
  source: z.enum(["generated", "stored", "fallback"]),
  generated_at: z.string(),
  warning: z.string().optional(),
});
