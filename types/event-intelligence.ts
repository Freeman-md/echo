import type { EventIntelligenceReport } from "@/lib/intelligence/schema";

export interface EventIntelligenceOverview {
  event_id: string;
  event_name: string;
  event_location: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  conversation_count: number;
  people_count: number;
}

export interface EventIntelligenceResponse {
  overview: EventIntelligenceOverview;
  report: EventIntelligenceReport;
  source: "generated" | "stored" | "fallback";
  generated_at: string;
  warning?: string;
}

export type EventIntelligenceErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "event_not_found"
  | "event_not_completed"
  | "missing_data"
  | "openai_failed"
  | "validation_failed"
  | "database_error";

export interface EventIntelligenceError {
  error: string;
  code: EventIntelligenceErrorCode;
}
