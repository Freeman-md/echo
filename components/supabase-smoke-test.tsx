"use client";

import { useCallback, useState } from "react";

import { getDeviceSessionId } from "@/lib/session/device-session";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { Event } from "@/types";

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SupabaseSmokeTest() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    setMessage(null);

    const { data, error } = await getSupabaseClient()
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      setMessage(`Could not fetch events: ${error.message}`);
    } else {
      setEvents((data ?? []) as Event[]);
    }

    setIsLoading(false);
  }, []);

  async function createTestEvent() {
    setIsCreating(true);
    setMessage(null);

    try {
      const { error } = await getSupabaseClient().from("events").insert({
        device_session_id: getDeviceSessionId(),
        name: `Connection test · ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        context: "Created by the Milestone 0 Supabase smoke test.",
      });

      if (error) throw error;

      setMessage("Test event created. Echo can read and write to Supabase.");
      await loadEvents();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create test event.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section
      aria-labelledby="connection-test-heading"
      className="glass-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7"
    >
      <div className="pointer-events-none absolute -right-14 -top-20 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-violet-300">
              Developer check
            </p>
            <h2
              id="connection-test-heading"
              className="text-xl font-semibold tracking-tight text-white"
            >
              Supabase connection
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-400">
              Create a temporary event, then confirm the five latest rows can
              be read back.
            </p>
          </div>
          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              isSupabaseConfigured
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                : "bg-amber-300"
            }`}
            title={isSupabaseConfigured ? "Configured" : "Not configured"}
          />
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.04] px-4 py-3 text-sm leading-6 text-amber-100/80">
            Add the two public Supabase values from{" "}
            <code className="text-amber-100">.env.example</code> to{" "}
            <code className="text-amber-100">.env.local</code> to enable this
            test.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={createTestEvent}
                disabled={isCreating}
                className="button-secondary justify-center disabled:cursor-wait disabled:opacity-60"
              >
                {isCreating ? "Creating…" : "Create test event"}
              </button>
              <button
                type="button"
                onClick={() => void loadEvents()}
                disabled={isLoading}
                className="rounded-full px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? "Refreshing…" : "Refresh events"}
              </button>
            </div>

            {message && (
              <p
                role="status"
                className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
              >
                {message}
              </p>
            )}

            <div className="mt-6 border-t border-white/[0.07] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Latest events
                </h3>
                <span className="text-xs text-slate-600">
                  {events.length} of 5
                </span>
              </div>

              {events.length > 0 ? (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {event.name ?? "Untitled event"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatEventDate(event.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-300">
                        {event.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-slate-500">
                  {isLoading ? "Looking for events…" : "No events yet."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
