import type { EventInsight, PersonMemory } from "@/types";

export interface EventMemoryData {
  people: PersonMemory[];
  eventInsight: EventInsight | null;
  isDemo: boolean;
}
