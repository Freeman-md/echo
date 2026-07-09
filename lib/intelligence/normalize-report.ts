import {
  eventIntelligenceReportSchema,
  type EventIntelligenceReport,
} from "@/lib/intelligence/schema";
import type { PersonMemory, Transcript } from "@/types";

interface NormalizeEventIntelligenceInput {
  report: EventIntelligenceReport;
  people: PersonMemory[];
  transcripts: Transcript[];
}

function uniqueLabels(values: string[]): string[] {
  const labels = new Map<string, string>();

  for (const value of values) {
    const label = value.trim();
    if (label && !labels.has(label.toLocaleLowerCase())) {
      labels.set(label.toLocaleLowerCase(), label);
    }
  }

  return [...labels.values()];
}

function displayTime(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp);
  if (Number.isNaN(timestamp.getTime())) return "Order estimated";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(timestamp);
}

export function normalizeEventIntelligenceReport({
  report,
  people,
  transcripts,
}: NormalizeEventIntelligenceInput): EventIntelligenceReport {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const transcriptOrder = new Map(
    transcripts.map((transcript, index) => [transcript.id, index]),
  );
  const transcriptsById = new Map(
    transcripts.map((transcript) => [transcript.id, transcript]),
  );

  const topics = uniqueLabels(report.topics);
  const companies = uniqueLabels(report.companies);
  const technologies = uniqueLabels(report.technologies);

  const priorityPeople = report.priority_people
    .filter(
      (item, index, items) =>
        peopleById.has(item.person_id) &&
        items.findIndex(
          (candidate) => candidate.person_id === item.person_id,
        ) === index,
    )
    .map((item) => {
      const person = peopleById.get(item.person_id);
      return {
        ...item,
        name: person?.name?.trim() || "Unnamed contact",
      };
    });

  const followUpQueue = report.follow_up_queue
    .filter(
      (item) => item.person_id === null || peopleById.has(item.person_id),
    )
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
            candidate.pattern.trim().toLocaleLowerCase() ===
            item.pattern.trim().toLocaleLowerCase(),
        ) === index,
    ),
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
  };

  return eventIntelligenceReportSchema.parse(normalizedReport);
}
