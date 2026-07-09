import type { EventInsight, PersonMemory } from "@/types";

export type ReconnectPriority = "high" | "medium" | "low" | "unknown";

export interface ExtractedPersonMemory {
  name: string;
  company: string;
  role: string;
  confidence: number;
  technologies: string[];
  topics: string[];
  interests: string[];
  career_interests: string[];
  projects: string[];
  memorable_details: string[];
  conversation_highlights: string[];
  collaboration_opportunities: string[];
  conversation_summary: string;
  follow_up: string;
  reconnect_priority: ReconnectPriority;
}

export interface ExtractedEventInsight {
  event_summary: string;
  topics: string[];
  patterns: string[];
  conversation_highlights: string[];
  recommended_actions: string[];
  overall_confidence: number;
}

export interface MemoryExtraction {
  people: ExtractedPersonMemory[];
  event_insight: ExtractedEventInsight;
}

export interface EventMemoryResponse {
  memory: MemoryExtraction;
  people: PersonMemory[];
  eventInsight: EventInsight;
  reused: boolean;
}

export interface EventMemoryError {
  error: string;
  code:
    | "invalid_request"
    | "event_not_found"
    | "event_not_completed"
    | "no_transcript"
    | "openai_failed"
    | "validation_failed"
    | "database_error";
}
