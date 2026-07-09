import { getDeviceSessionId } from "@/lib/session/device-session";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Event } from "@/types";
import type { CreateEventInput } from "@/types/event-lifecycle";

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await getSupabaseClient()
    .from("events")
    .insert({
      device_session_id: getDeviceSessionId(),
      name: input.name.trim() || "Untitled event",
      location: input.location.trim() || null,
      context: input.context.trim() || null,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not start event: ${error.message}`);

  return data as Event;
}

export async function completeEvent(eventId: string): Promise<Event> {
  const endedAt = new Date().toISOString();
  const { data, error } = await getSupabaseClient()
    .from("events")
    .update({
      status: "completed",
      ended_at: endedAt,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) throw new Error(`Could not end event: ${error.message}`);

  return data as Event;
}
