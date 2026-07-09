import { EventInsightCards } from "@/components/memory-cards/event-insight-cards";
import { MemoryPersonCard } from "@/components/memory-cards/memory-person-card";
import type { Event } from "@/types";
import type { EventMemoryData } from "@/types/memory-cards";

const priorityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

interface MemoryCardsContentProps {
  event: Event;
  data: EventMemoryData;
}

export function MemoryCardsContent({
  event,
  data,
}: MemoryCardsContentProps) {
  const { people, eventInsight } = data;
  const sortedPeople = [...people].sort((left, right) => {
    const priorityDifference =
      (priorityRank[left.reconnect_priority ?? "unknown"] ?? 3) -
      (priorityRank[right.reconnect_priority ?? "unknown"] ?? 3);
    return (
      priorityDifference ||
      (right.confidence ?? 0) - (left.confidence ?? 0)
    );
  });
  const topics = new Set([
    ...(eventInsight?.key_topics ?? []),
    ...people.flatMap((person) => person.topics ?? []),
  ]);
  const followUps = people.filter((person) =>
    Boolean(person.suggested_follow_up),
  ).length;
  const priorityConnections = people.filter(
    (person) => person.reconnect_priority?.toLowerCase() === "high",
  ).length;

  return (
    <section className="mt-10" aria-labelledby="memory-cards-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            AI Memory
          </p>
          <h2
            id="memory-cards-heading"
            className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white"
          >
            Your memory of the room
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[0.66rem] text-slate-500">
          {data.isDemo ? "Demo memory" : "Saved to Echo"}
        </span>
      </div>

      {data.isDemo && (
        <div className="mb-5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/65">
          Showing isolated demo memories because this event has no processed
          memory yet.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MemoryStat label="People remembered" value={people.length} symbol="○" />
        <MemoryStat label="Topics discovered" value={topics.size} symbol="◇" />
        <MemoryStat label="Follow-ups" value={followUps} symbol="↗" />
        <MemoryStat
          label="Priority connections"
          value={priorityConnections}
          symbol="✦"
        />
      </div>

      {eventInsight && (
        <div className="mt-7">
          <EventInsightCards insight={eventInsight} />
        </div>
      )}

      <div className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-slate-600">
              People Echo remembered
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Connections from {event.name ?? "this event"}
            </h2>
          </div>
          <span className="text-xs text-slate-600">
            {people.length} {people.length === 1 ? "memory" : "memories"}
          </span>
        </div>

        {sortedPeople.length > 0 ? (
          <div className="grid gap-3">
            {sortedPeople.map((person) => (
              <MemoryPersonCard key={person.id} person={person} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-7 text-center text-sm text-slate-500">
            Event insights are ready, but no individual conversation was clear
            enough to become a person memory.
          </p>
        )}
      </div>
    </section>
  );
}

function MemoryStat({
  label,
  value,
  symbol,
}: {
  label: string;
  value: number;
  symbol: string;
}) {
  return (
    <div className="glass-card rounded-[1.25rem] p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
        <span className="text-sm text-violet-300/55">{symbol}</span>
      </div>
      <p className="mt-2 text-[0.64rem] font-medium uppercase leading-4 tracking-[0.11em] text-slate-600">
        {label}
      </p>
    </div>
  );
}
