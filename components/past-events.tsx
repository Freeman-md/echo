import type { Event } from "@/types";

interface PastEventsProps {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (event: Event) => void;
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function eventDuration(event: Event): string {
  if (!event.ended_at) return "Still active";
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(event.ended_at).getTime() -
        new Date(event.started_at).getTime()) /
        60_000,
    ),
  );
  if (minutes < 1) return "Under a minute";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function PastEvents({
  events,
  isLoading,
  error,
  onRetry,
  onOpen,
}: PastEventsProps) {
  return (
    <section className="mx-auto min-h-[38rem] w-full max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
        Event history
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
        Rooms you remember
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
        Revisit the people, conversations, and next moves Echo saved for you.
      </p>

      {isLoading ? (
        <div className="glass-card mt-8 rounded-[1.6rem] px-6 py-10 text-center text-sm text-slate-500">
          Loading your events…
        </div>
      ) : error ? (
        <div className="glass-card mt-8 rounded-[1.6rem] px-6 py-9 text-center">
          <p className="text-sm text-rose-100/75">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="button-secondary mx-auto mt-5 flex"
          >
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card mt-8 rounded-[1.6rem] px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-200/10 bg-violet-300/[0.05] text-violet-200">
            ○
          </span>
          <h2 className="mt-5 text-lg font-semibold text-white">
            Your first room is waiting
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Start an event and Echo will keep its conversations here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onOpen(event)}
              className="glass-card group w-full rounded-[1.5rem] p-5 text-left transition hover:border-violet-200/15 hover:bg-white/[0.045] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[0.61rem] font-semibold uppercase tracking-[0.12em] ${
                        event.status === "active"
                          ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-200"
                          : "border-violet-300/12 bg-violet-300/[0.05] text-violet-200"
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="text-xs text-slate-600">
                      {formatEventDate(event.started_at)}
                    </span>
                  </div>
                  <h2 className="mt-3 truncate text-lg font-semibold text-white">
                    {event.name ?? "Untitled event"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {eventDuration(event)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                <span className="mt-1 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-200">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
