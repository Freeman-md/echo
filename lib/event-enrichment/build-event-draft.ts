import { inferEventDraft } from "@/lib/events/infer-event-draft";
import type {
  EventClue,
  EventDraft,
  EventEnrichment,
} from "@/types/event-lifecycle";

function addValue(lines: string[], label: string, value: string) {
  if (value.trim()) lines.push(`${label}: ${value.trim()}`);
}

function addList(lines: string[], label: string, values: string[]) {
  if (values.length > 0) lines.push(`${label}: ${values.join("; ")}`);
}

export function buildEnrichedEventDraft(
  clue: EventClue,
  enrichment: EventEnrichment,
  warning?: string,
): EventDraft {
  const fallback = inferEventDraft(clue);
  const context: string[] = [];

  addValue(context, "Summary", enrichment.summary);
  addValue(context, "Organiser", enrichment.organiser);
  addValue(context, "Date", enrichment.date);
  addValue(context, "Event type", enrichment.event_type);
  addList(context, "Technologies and topics", enrichment.technologies);
  addList(context, "Sponsors", enrichment.sponsors);
  addList(context, "Agenda", enrichment.agenda);
  addList(context, "Likely attendees", enrichment.likely_attendees);
  addList(context, "Recommended focus", enrichment.recommended_focus);
  addList(context, "Conversation tips", enrichment.conversation_tips);
  context.push(`AI confidence: ${Math.round(enrichment.confidence * 100)}%`);

  const sourceLabel =
    clue.type === "url"
      ? "Original event link"
      : clue.type === "image"
        ? "Screenshot attached"
        : "Original clue";
  context.push(`${sourceLabel}: ${fallback.sourceClue}`);

  return {
    ...fallback,
    name: enrichment.event_name.trim() || fallback.name,
    location: enrichment.location.trim(),
    context: context.join("\n\n"),
    enrichment,
    enrichmentSource: "ai",
    enrichmentWarning: warning,
  };
}
