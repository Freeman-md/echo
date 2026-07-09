import type { Metadata } from "next";

import { EventIntelligenceView } from "@/components/event-intelligence/event-intelligence-view";

export const metadata: Metadata = {
  title: "Event Intelligence — Echo",
  description:
    "A holistic view of event patterns, priority connections, and next actions.",
};

export default async function EventIntelligencePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventIntelligenceView eventId={eventId} />;
}
