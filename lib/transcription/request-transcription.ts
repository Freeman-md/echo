import type {
  TranscriptionErrorCode,
  TranscriptionErrorResponse,
  TranscriptionResponse,
} from "@/types/conversation-capture";

export type TranscriptionRequestErrorCode =
  | TranscriptionErrorCode
  | "UPLOAD_FAILED";

export class TranscriptionRequestError extends Error {
  constructor(
    public readonly code: TranscriptionRequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TranscriptionRequestError";
  }
}

interface RequestTranscriptionOptions {
  onUploadProgress: (percentage: number) => void;
  onUploadComplete: () => void;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isTranscriptionResponse(value: unknown): value is TranscriptionResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<TranscriptionResponse>;
  return (
    typeof candidate.transcript === "string" &&
    Boolean(candidate.transcript.trim()) &&
    typeof candidate.model === "string"
  );
}

function isTranscriptionErrorResponse(
  value: unknown,
): value is TranscriptionErrorResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<TranscriptionErrorResponse>;
  return (
    typeof candidate.error === "string" &&
    (candidate.code === "INVALID_AUDIO" ||
      candidate.code === "FILE_TOO_LARGE" ||
      candidate.code === "TRANSCRIPTION_FAILED")
  );
}

export function requestTranscription(
  audio: File,
  {
    onUploadProgress,
    onUploadComplete,
  }: RequestTranscriptionOptions,
): Promise<TranscriptionResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("audio", audio);

    const request = new XMLHttpRequest();
    let uploadCompleted = false;

    request.open("POST", "/api/transcription");
    request.timeout = 150_000;

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total === 0) return;
      onUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });

    request.upload.addEventListener("load", () => {
      uploadCompleted = true;
      onUploadProgress(100);
      onUploadComplete();
    });

    request.addEventListener("load", () => {
      const payload = parseJson(request.responseText);

      if (request.status >= 200 && request.status < 300) {
        if (isTranscriptionResponse(payload)) {
          resolve(payload);
          return;
        }

        reject(
          new TranscriptionRequestError(
            "TRANSCRIPTION_FAILED",
            "Echo received an empty transcript. Retry or paste the transcript manually.",
          ),
        );
        return;
      }

      if (isTranscriptionErrorResponse(payload)) {
        reject(new TranscriptionRequestError(payload.code, payload.error));
        return;
      }

      reject(
        new TranscriptionRequestError(
          uploadCompleted ? "TRANSCRIPTION_FAILED" : "UPLOAD_FAILED",
          uploadCompleted
            ? "OpenAI could not transcribe this audio. Retry or paste the transcript manually."
            : "The audio upload failed. Check your connection and try again.",
        ),
      );
    });

    request.addEventListener("error", () => {
      reject(
        new TranscriptionRequestError(
          "UPLOAD_FAILED",
          "The audio upload failed. Check your connection and try again.",
        ),
      );
    });

    request.addEventListener("timeout", () => {
      reject(
        new TranscriptionRequestError(
          uploadCompleted ? "TRANSCRIPTION_FAILED" : "UPLOAD_FAILED",
          uploadCompleted
            ? "Transcription took too long. Retry or paste the transcript manually."
            : "The audio upload timed out. Check your connection and try again.",
        ),
      );
    });

    request.send(formData);
  });
}
