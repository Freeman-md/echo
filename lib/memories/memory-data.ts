import { getDemoMemory, isDemoMemoryEnabled } from "@/data/demo-memory";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EventInsight, PersonMemory } from "@/types";
import type { EventMemoryData } from "@/types/memory-cards";

export async function fetchPeopleForEvent(
  eventId: string,
): Promise<PersonMemory[]> {
  const { data, error } = await getSupabaseClient()
    .from("people")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load people memories: ${error.message}`);
  }

  return (data ?? []) as PersonMemory[];
}

export async function fetchEventInsights(
  eventId: string,
): Promise<EventInsight | null> {
  const { data, error } = await getSupabaseClient()
    .from("event_insights")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load event insights: ${error.message}`);
  }

  return (data as EventInsight | null) ?? null;
}

export async function fetchEventMemories(
  eventId: string,
): Promise<EventMemoryData> {
  const [people, eventInsight] = await Promise.all([
    fetchPeopleForEvent(eventId),
    fetchEventInsights(eventId),
  ]);

  if (people.length === 0 && !eventInsight && isDemoMemoryEnabled) {
    return getDemoMemory();
  }

  return {
    people,
    eventInsight,
    isDemo: false,
  };
}
