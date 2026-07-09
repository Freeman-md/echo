import type { EventInsight, PersonMemory } from "@/types";
import type {
  ExtractedPersonMemory,
  MemoryExtraction,
} from "@/types/memory";

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function toPersonRows(
  eventId: string,
  memory: MemoryExtraction,
): Array<Omit<PersonMemory, "id" | "created_at">> {
  return memory.people.map((person) => ({
    event_id: eventId,
    name: person.name || null,
    inferred_role: person.role || null,
    company: person.company || null,
    confidence: person.confidence,
    summary: person.conversation_summary || null,
    topics: unique([...person.topics, ...person.technologies]),
    interests: unique([...person.interests, ...person.career_interests]),
    memorable_details: unique([
      ...person.memorable_details,
      ...person.conversation_highlights,
    ]),
    suggested_follow_up: person.follow_up || null,
    reconnect_priority: person.reconnect_priority,
    raw_json: { ...person },
  }));
}

export function toEventInsightRow(
  eventId: string,
  memory: MemoryExtraction,
): Omit<EventInsight, "id" | "created_at"> {
  return {
    event_id: eventId,
    summary: memory.event_insight.event_summary || null,
    key_topics: unique(memory.event_insight.topics),
    patterns: unique(memory.event_insight.patterns),
    // Missed-opportunity inference is deliberately outside Milestone 3.
    missed_opportunities: [],
    recommended_next_actions: unique(
      memory.event_insight.recommended_actions,
    ),
    // The complete validated extraction is a recovery checkpoint and retains
    // fields that do not yet have first-class database columns.
    raw_json: { ...memory },
  };
}

export function personFromRow(person: PersonMemory): ExtractedPersonMemory {
  const raw = person.raw_json;

  return {
    name: person.name ?? "",
    company: person.company ?? "",
    role: person.inferred_role ?? "",
    confidence: person.confidence ?? 0,
    technologies: [],
    topics: person.topics ?? [],
    interests: person.interests ?? [],
    career_interests: [],
    projects: [],
    memorable_details: person.memorable_details ?? [],
    conversation_highlights: [],
    collaboration_opportunities: [],
    conversation_summary: person.summary ?? "",
    follow_up: person.suggested_follow_up ?? "",
    reconnect_priority:
      raw &&
      typeof raw.reconnect_priority === "string" &&
      ["high", "medium", "low", "unknown"].includes(raw.reconnect_priority)
        ? (raw.reconnect_priority as ExtractedPersonMemory["reconnect_priority"])
        : "unknown",
  };
}
