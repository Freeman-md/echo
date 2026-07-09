import { getSupabaseClient } from "@/lib/supabase/client";
import type { Transcript } from "@/types";
import type { TranscriptSource } from "@/types/conversation-capture";

interface CreateTranscriptInput {
  id: string;
  eventId: string;
  rawText: string;
  source: TranscriptSource;
}

export async function createTranscript({
  id,
  eventId,
  rawText,
  source,
}: CreateTranscriptInput): Promise<Transcript> {
  const transcript = rawText.trim();

  if (!transcript) {
    throw new Error("Add a transcript before saving.");
  }

  const { data, error } = await getSupabaseClient()
    .from("transcripts")
    .upsert({
      id,
      event_id: eventId,
      raw_text: transcript,
      source,
    }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not save transcript: ${error.message}`);
  }

  return data as Transcript;
}

export async function listTranscriptsForEvent(
  eventId: string,
): Promise<Transcript[]> {
  const { data, error } = await getSupabaseClient()
    .from("transcripts")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load conversation batches: ${error.message}`);
  }

  return (data ?? []) as Transcript[];
}
