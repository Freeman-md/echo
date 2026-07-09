"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { CompletedEventShell } from "@/components/completed-event-shell";
import { EventLifecycle } from "@/components/event-lifecycle";
import { PastEvents } from "@/components/past-events";
import { listUserEvents } from "@/lib/events/event-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Event } from "@/types";

type AppTab = "current" | "past" | "account";

interface EchoAppProps {
  user: User;
}

function EchoMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.055]">
      <span className="absolute h-4 w-4 rounded-full border border-violet-300/70" />
      <span className="absolute h-6 w-6 rounded-full border border-violet-300/20" />
      <span className="h-1.5 w-1.5 rounded-full bg-violet-200 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
    </span>
  );
}

export function EchoApp({ user }: EchoAppProps) {
  const [tab, setTab] = useState<AppTab>("current");
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [selectedPastEvent, setSelectedPastEvent] = useState<Event | null>(
    null,
  );
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reloadAttempt, setReloadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    listUserEvents()
      .then((loadedEvents) => {
        if (!active) return;
        setEvents(loadedEvents);
        setCurrentEvent(
          (existing) =>
            existing ??
            loadedEvents.find((event) => event.status === "active") ??
            null,
        );
        setEventsError(null);
        setIsLoadingEvents(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setEventsError(
          error instanceof Error ? error.message : "Could not load your events.",
        );
        setIsLoadingEvents(false);
      });

    return () => {
      active = false;
    };
  }, [reloadAttempt, user.id]);

  function updateEvent(event: Event | null) {
    setCurrentEvent(event);
    if (!event) return;
    setEvents((current) =>
      [event, ...current.filter((item) => item.id !== event.id)].sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime(),
      ),
    );
  }

  function retryEvents() {
    setIsLoadingEvents(true);
    setEventsError(null);
    setReloadAttempt((current) => current + 1);
  }

  function openEvent(event: Event) {
    if (event.status === "active") {
      setCurrentEvent(event);
      setTab("current");
      return;
    }
    setSelectedPastEvent(event);
  }

  async function signOut() {
    await getSupabaseClient().auth.signOut();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.06]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.08]" />

      <div className="mx-auto flex w-full max-w-5xl flex-col px-5 pb-24 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
        <header className="relative flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setTab("current")}
            className="flex items-center gap-2.5"
            aria-label="Open current event"
          >
            <EchoMark />
            <span className="text-base font-semibold tracking-[-0.02em] text-white">
              Echo
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("account")}
            className="max-w-[12rem] truncate rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-500 transition hover:text-slate-300"
          >
            {user.email ?? "Account"}
          </button>
        </header>

        <nav className="relative mx-auto mt-6 hidden rounded-full border border-white/[0.07] bg-black/25 p-1 sm:flex">
          <NavButton
            active={tab === "current"}
            onClick={() => setTab("current")}
          >
            Current
          </NavButton>
          <NavButton
            active={tab === "past"}
            onClick={() => {
              setSelectedPastEvent(null);
              setTab("past");
            }}
          >
            Past events
          </NavButton>
          <NavButton
            active={tab === "account"}
            onClick={() => setTab("account")}
          >
            Account
          </NavButton>
        </nav>

        {tab === "current" &&
          (isLoadingEvents ? (
            <div className="flex min-h-[36rem] items-center justify-center text-sm text-slate-500">
              Finding your current event…
            </div>
          ) : eventsError ? (
            <div className="flex min-h-[36rem] items-center justify-center">
              <div className="glass-card max-w-md rounded-[1.75rem] px-6 py-9 text-center">
                <h1 className="text-xl font-semibold text-white">
                  Echo could not load your events
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {eventsError}
                </p>
                <button
                  type="button"
                  onClick={retryEvents}
                  className="button-secondary mx-auto mt-5 flex"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <EventLifecycle
              key={currentEvent?.id ?? "new-event"}
              initialEvent={currentEvent}
              onEventChange={updateEvent}
            />
          ))}

        {tab === "past" &&
          (selectedPastEvent ? (
            <CompletedEventShell
              event={selectedPastEvent}
              onReset={() => setSelectedPastEvent(null)}
            />
          ) : (
            <PastEvents
              events={events}
              isLoading={isLoadingEvents}
              error={eventsError}
              onRetry={retryEvents}
              onOpen={openEvent}
            />
          ))}

        {tab === "account" && (
          <section className="mx-auto flex min-h-[38rem] w-full max-w-xl items-center py-12">
            <div className="glass-card w-full rounded-[2rem] p-6 text-center sm:p-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-violet-200/10 bg-violet-300/[0.06] text-xl text-violet-100">
                {(user.email?.charAt(0) ?? "E").toUpperCase()}
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Signed in
              </p>
              <h1 className="mt-2 truncate text-xl font-semibold text-white">
                {user.email}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your event history and memories are private to this account.
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="button-secondary mx-auto mt-7 flex"
              >
                Sign out
              </button>
            </div>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-between border-t border-white/[0.06] py-6 text-xs text-slate-600">
          <span>Echo</span>
          <span>Built for moments that matter.</span>
        </footer>
      </div>

      <nav
        className="fixed inset-x-4 z-20 grid grid-cols-3 rounded-2xl border border-white/[0.09] bg-[#0b0c13]/95 p-1.5 shadow-2xl backdrop-blur-xl sm:hidden"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <MobileNavButton
          active={tab === "current"}
          onClick={() => setTab("current")}
        >
          Current
        </MobileNavButton>
        <MobileNavButton
          active={tab === "past"}
          onClick={() => {
            setSelectedPastEvent(null);
            setTab("past");
          }}
        >
          Past
        </MobileNavButton>
        <MobileNavButton
          active={tab === "account"}
          onClick={() => setTab("account")}
        >
          Account
        </MobileNavButton>
      </nav>
    </main>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-medium transition ${
        active ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-2 py-2.5 text-xs font-medium transition ${
        active ? "bg-violet-300/10 text-violet-100" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}
