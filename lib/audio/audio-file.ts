// Leave room below Vercel's 4.5 MB request-body limit for multipart headers.
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export const AUDIO_FILE_ACCEPT = [
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".ogg",
  ".wav",
  ".webm",
  "audio/*",
].join(",");

const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "ogg",
  "wav",
  "webm",
]);

const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/x-wav",
  "video/mp4",
  "video/webm",
]);

export type AudioFileValidationCode =
  | "INVALID_AUDIO"
  | "FILE_TOO_LARGE";

export interface AudioFileValidationError {
  code: AudioFileValidationCode;
  message: string;
}

function fileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function validateAudioFile(file: File): AudioFileValidationError | null {
  if (file.size === 0) {
    return {
      code: "INVALID_AUDIO",
      message: "This audio file is empty. Choose another recording.",
    };
  }

  if (file.size >= MAX_AUDIO_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      message:
        "Audio must be smaller than 4 MB. Choose a shorter or compressed recording.",
    };
  }

  const mimeType = file.type.toLowerCase().split(";")[0];
  const hasSupportedMimeType =
    !mimeType || SUPPORTED_AUDIO_MIME_TYPES.has(mimeType);
  const hasSupportedExtension = SUPPORTED_AUDIO_EXTENSIONS.has(
    fileExtension(file.name),
  );

  if (!hasSupportedMimeType && !hasSupportedExtension) {
    return {
      code: "INVALID_AUDIO",
      message:
        "Choose an MP3, MP4, M4A, MPEG, MPGA, FLAC, OGG, WAV, or WebM audio file.",
    };
  }

  return null;
}
