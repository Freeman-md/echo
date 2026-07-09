export type TranscriptSource = "microphone" | "upload" | "manual";

export type TranscriptionErrorCode =
  | "INVALID_AUDIO"
  | "FILE_TOO_LARGE"
  | "TRANSCRIPTION_FAILED";

export interface TranscriptionResponse {
  transcript: string;
  model: string;
}

export interface TranscriptionErrorResponse {
  error: string;
  code: TranscriptionErrorCode;
}
