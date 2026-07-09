import "server-only";

import type {
  TranscriptionDiarized,
  TranscriptionDiarizedSegment,
} from "openai/resources/audio/transcriptions";

import { getOpenAIClient } from "@/lib/openai/client";

export const TRANSCRIPTION_MODEL = "gpt-4o-transcribe-diarize";

function isDiarizedTranscription(
  value: unknown,
): value is TranscriptionDiarized {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<TranscriptionDiarized>;
  return (
    typeof candidate.text === "string" &&
    Array.isArray(candidate.segments) &&
    candidate.segments.every(
      (segment) =>
        typeof segment === "object" &&
        segment !== null &&
        typeof (segment as Partial<TranscriptionDiarizedSegment>).speaker ===
          "string" &&
        typeof (segment as Partial<TranscriptionDiarizedSegment>).text ===
          "string",
    )
  );
}

function formatSpeakerTranscript(
  segments: TranscriptionDiarizedSegment[],
  fallbackText: string,
): string {
  const speakerTurns: Array<{ speaker: string; text: string }> = [];

  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;

    const previousTurn = speakerTurns.at(-1);
    if (previousTurn?.speaker === segment.speaker) {
      previousTurn.text = `${previousTurn.text} ${text}`;
    } else {
      speakerTurns.push({ speaker: segment.speaker, text });
    }
  }

  if (speakerTurns.length === 0) return fallbackText.trim();

  return speakerTurns
    .map(({ speaker, text }) => `Speaker ${speaker}: ${text}`)
    .join("\n\n");
}

export async function transcribeAudio(audio: File): Promise<string> {
  const response = await getOpenAIClient().audio.transcriptions.create(
    {
      file: audio,
      model: TRANSCRIPTION_MODEL,
      response_format: "diarized_json",
      chunking_strategy: "auto",
    },
    {
      timeout: 100_000,
      maxRetries: 0,
    },
  );

  const transcript = isDiarizedTranscription(response)
    ? formatSpeakerTranscript(response.segments, response.text)
    : response.text.trim();

  if (!transcript) {
    throw new Error("OpenAI returned an empty transcript.");
  }

  return transcript;
}
