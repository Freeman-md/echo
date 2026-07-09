import { getDeviceSessionId } from "@/lib/session/device-session";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Event } from "@/types";
import type { CreateEventInput } from "@/types/event-lifecycle";

async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) {
    throw new Error("Sign in before creating or loading events.");
  }
  return data.user.id;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const userId = await requireUserId();
  const { data, error } = await getSupabaseClient()
    .from("events")
    .insert({
      user_id: userId,
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

export async function listUserEvents(): Promise<Event[]> {
  const userId = await requireUserId();
  const { data, error } = await getSupabaseClient()
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load your events: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getUserEvent(eventId: string): Promise<Event> {
  const userId = await requireUserId();
  const { data, error } = await getSupabaseClient()
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(`Could not load this event: ${error.message}`);
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
