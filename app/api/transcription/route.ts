import { NextResponse } from "next/server";

import { validateAudioFile } from "@/lib/audio/audio-file";
import {
  transcribeAudio,
  TRANSCRIPTION_MODEL,
} from "@/lib/openai/transcribe-audio";
import type {
  TranscriptionErrorResponse,
  TranscriptionResponse,
} from "@/types/conversation-capture";

export const runtime = "nodejs";
export const maxDuration = 120;

function invalidAudioResponse(
  error: string,
  code: "INVALID_AUDIO" | "FILE_TOO_LARGE" = "INVALID_AUDIO",
) {
  return NextResponse.json<TranscriptionErrorResponse>(
    { error, code },
    { status: code === "FILE_TOO_LARGE" ? 413 : 400 },
  );
}

export async function POST(request: Request) {
  let audio: File;

  try {
    const formData = await request.formData();
    const candidate = formData.get("audio");

    if (!(candidate instanceof File)) {
      return invalidAudioResponse("Choose an audio recording to transcribe.");
    }

    audio = candidate;
  } catch {
    return invalidAudioResponse(
      "Echo could not read this audio upload. Choose the file again.",
    );
  }

  const validationError = validateAudioFile(audio);
  if (validationError) {
    return invalidAudioResponse(
      validationError.message,
      validationError.code,
    );
  }

  try {
    const transcript = await transcribeAudio(audio);
    return NextResponse.json<TranscriptionResponse>({
      transcript,
      model: TRANSCRIPTION_MODEL,
    });
  } catch (error) {
    console.error(
      "Audio transcription failed:",
      error instanceof Error ? error.message : "Unknown transcription error",
    );

    return NextResponse.json<TranscriptionErrorResponse>(
      {
        error:
          "OpenAI could not transcribe this audio. Retry or paste the transcript manually.",
        code: "TRANSCRIPTION_FAILED",
      },
      { status: 502 },
    );
  }
}
