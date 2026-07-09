import {
  eventIntelligenceReportSchema,
  type EventIntelligenceReport,
} from "@/lib/intelligence/schema";
import { memoryExtractionSchema } from "@/lib/memory/schema";
import type { EventInsight, PersonMemory, Transcript } from "@/types";

interface NormalizeEventIntelligenceInput {
  report: EventIntelligenceReport;
  people: PersonMemory[];
  transcripts: Transcript[];
  eventInsight: EventInsight | null;
}

function normalizationKey(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function uniqueLabels(values: string[]): string[] {
  const labels = new Map<string, string>();

  for (const value of values) {
    const label = value.trim();
    const key = normalizationKey(label);
    if (key && !labels.has(key)) {
      labels.set(key, label);
    }
  }

  return [...labels.values()];
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStringValues);
  }
  return [];
}

function hasGroundedLabel(label: string, evidence: string): boolean {
  const key = normalizationKey(label);
  if (!key) return false;

  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,
    "u",
  ).test(evidence);
}

function displayTime(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp);
  if (Number.isNaN(timestamp.getTime())) return "Order estimated";

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(timestamp);
  return `${time} UTC`;
}

export function normalizeEventIntelligenceReport({
  report,
  people,
  transcripts,
  eventInsight,
}: NormalizeEventIntelligenceInput): EventIntelligenceReport {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const transcriptOrder = new Map(
    transcripts.map((transcript, index) => [transcript.id, index]),
  );
  const transcriptsById = new Map(
    transcripts.map((transcript) => [transcript.id, transcript]),
  );

  const checkpoint = eventInsight
    ? memoryExtractionSchema.safeParse(eventInsight.raw_json)
    : null;
  const evidenceValues = [
    ...people.flatMap((person) =>
      collectStringValues({
        name: person.name,
        role: person.inferred_role,
        company: person.company,
        summary: person.summary,
        topics: person.topics,
        interests: person.interests,
        memorable_details: person.memorable_details,
        suggested_follow_up: person.suggested_follow_up,
        memory: person.raw_json,
      }),
    ),
    ...transcripts.map((transcript) => transcript.raw_text),
    ...(checkpoint?.success
      ? collectStringValues(checkpoint.data.event_insight)
      : []),
  ];
  const evidenceCorpus = normalizationKey(evidenceValues.join("\n"));
  const groundedLabels = (values: string[]) =>
    uniqueLabels(values)
      .filter((value) => hasGroundedLabel(value, evidenceCorpus))
      .slice(0, 24);

  const topics = groundedLabels(report.topics);
  const companies = groundedLabels(report.companies);
  const technologies = groundedLabels(report.technologies);

  const priorityPeople = report.priority_people
    .filter(
      (item, index, items) =>
        peopleById.has(item.person_id) &&
        items.findIndex(
          (candidate) => candidate.person_id === item.person_id,
        ) === index,
    )
    .slice(0, 12)
    .map((item) => {
      const person = peopleById.get(item.person_id);
      return {
        ...item,
        name: person?.name?.trim() || "Unnamed contact",
      };
    });

  const followUpQueue = report.follow_up_queue
    .filter(
      (item) =>
        (item.person_id === null && item.person_name === null) ||
        (item.person_id !== null && peopleById.has(item.person_id)),
    )
    .slice(0, 16)
    .map((item) => {
      if (!item.person_id) {
        return { ...item, person_id: null, person_name: null };
      }

      const person = peopleById.get(item.person_id);
      return {
        ...item,
        person_name: person?.name?.trim() || "Unnamed contact",
      };
    });

  const timeline = report.timeline
    .filter(
      (item) =>
        transcripts.length === 0 ||
        (item.transcript_id !== null &&
          transcriptsById.has(item.transcript_id)),
    )
    .slice(0, 20)
    .map((item) => {
      const transcript = item.transcript_id
        ? transcriptsById.get(item.transcript_id)
        : null;

      return {
        ...item,
        transcript_id: transcript?.id ?? null,
        occurred_at: transcript?.created_at ?? null,
        time_label: transcript
          ? displayTime(transcript.created_at)
          : "Order estimated",
        person_ids: item.person_ids.filter((personId) =>
          peopleById.has(personId),
        ),
      };
    })
    .sort((left, right) => {
      const leftOrder = left.transcript_id
        ? (transcriptOrder.get(left.transcript_id) ?? transcripts.length)
        : transcripts.length + left.sequence;
      const rightOrder = right.transcript_id
        ? (transcriptOrder.get(right.transcript_id) ?? transcripts.length)
        : transcripts.length + right.sequence;
      return leftOrder - rightOrder;
    })
    .map((item, index) => ({ ...item, sequence: index }));

  const normalizedReport: EventIntelligenceReport = {
    ...report,
    summary: report.summary.trim(),
    patterns: report.patterns.filter(
      (item, index, patterns) =>
        item.pattern.trim() &&
        patterns.findIndex(
          (candidate) =>
            normalizationKey(candidate.pattern) ===
            normalizationKey(item.pattern),
        ) === index,
    ).slice(0, 10),
    priority_people: priorityPeople,
    follow_up_queue: followUpQueue,
    timeline,
    topics,
    companies,
    technologies,
    metrics: {
      conversations: transcripts.length,
      people_remembered: people.length,
      topics_discussed: topics.length,
      companies_mentioned: companies.length,
      technologies_mentioned: technologies.length,
      recommended_follow_ups: followUpQueue.length,
      high_priority_people: priorityPeople.filter(
        (person) => person.reconnect_priority === "high",
      ).length,
    },
    overall_confidence: Number.isFinite(report.overall_confidence)
      ? Math.min(1, Math.max(0, report.overall_confidence))
      : 0,
  };

  return eventIntelligenceReportSchema.parse(normalizedReport);
}
