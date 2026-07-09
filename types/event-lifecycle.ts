export type EventClueType = "text" | "url" | "image";

export interface EventClue {
  type: EventClueType;
  value: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface EventEnrichment {
  event_name: string;
  organiser: string;
  location: string;
  date: string;
  event_type: string;
  summary: string;
  technologies: string[];
  sponsors: string[];
  agenda: string[];
  likely_attendees: string[];
  recommended_focus: string[];
  conversation_tips: string[];
  confidence: number;
}

export interface EventDraft {
  name: string;
  location: string;
  context: string;
  sourceClue: string;
  sourceType: EventClueType;
  enrichment?: EventEnrichment;
  enrichmentSource?: "ai" | "fallback";
  enrichmentWarning?: string;
}

export interface CreateEventInput {
  name: string;
  location: string;
  context: string;
}

export interface EnrichEventResponse {
  draft: EventDraft;
  source: "ai" | "fallback";
  warning?: string;
}
