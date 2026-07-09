export type EventClueType = "text" | "url" | "image";

export interface EventClue {
  type: EventClueType;
  value: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface EventDraft {
  name: string;
  location: string;
  context: string;
  sourceClue: string;
  sourceType: EventClueType;
}

export interface CreateEventInput {
  name: string;
  location: string;
  context: string;
}
