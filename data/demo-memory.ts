import type { EventInsight, PersonMemory } from "@/types";
import type { EventMemoryData } from "@/types/memory-cards";

/**
 * Temporary UI-only fallback for hackathon demos.
 * This data is never written to Supabase and is only returned when:
 * 1. an event has no persisted memory, and
 * 2. NEXT_PUBLIC_ENABLE_DEMO_MEMORY is explicitly set to "true".
 */

const DEMO_EVENT_ID = "demo-google-ai-builder-night";
const DEMO_CREATED_AT = "2026-07-09T19:00:00.000Z";

const demoPeople: PersonMemory[] = [
  {
    id: "demo-josh",
    event_id: DEMO_EVENT_ID,
    name: "Josh",
    inferred_role: "Organiser · Cursor team",
    company: "Cursor",
    confidence: 0.94,
    summary:
      "Josh shared an organiser’s view of agentic products and what makes a hackathon project feel genuinely useful.",
    topics: ["Cursor iOS", "AI agents", "Hackathon judging"],
    interests: ["Agent workflows", "Practical AI products"],
    memorable_details: [
      "Explained what judges look for in agentic products.",
      "Was interested in products that take useful action, not just generate text.",
    ],
    suggested_follow_up:
      "Ask how Cursor internally evaluates and improves agent workflows.",
    reconnect_priority: "high",
    raw_json: {
      collaboration_opportunities: [
        "Share Echo’s event-memory workflow after the next iteration.",
      ],
      projects: ["Cursor agent workflows"],
    },
    created_at: DEMO_CREATED_AT,
  },
  {
    id: "demo-sunita",
    event_id: DEMO_EVENT_ID,
    name: "Sunita",
    inferred_role: "Software engineer",
    company: null,
    confidence: 0.86,
    summary:
      "Sunita was interested in practical AI infrastructure and how products like Echo can make AI useful outside a chat window.",
    topics: ["AI infrastructure", "London tech", "Startups"],
    interests: ["Practical AI products", "Developer tools"],
    memorable_details: [
      "Interested in practical AI products with clear real-world value.",
      "Shared perspectives on London’s startup community.",
    ],
    suggested_follow_up:
      "Share Echo and ask what she thinks of real-world memory tools.",
    reconnect_priority: "medium",
    raw_json: {
      collaboration_opportunities: [
        "Get technical feedback on Echo’s event-memory architecture.",
      ],
    },
    created_at: DEMO_CREATED_AT,
  },
  {
    id: "demo-students",
    event_id: DEMO_EVENT_ID,
    name: "Ghanaian student group",
    inferred_role: "Students · early-career builders",
    company: null,
    confidence: 0.78,
    summary:
      "A group of students exploring AI through hackathons and school projects, with strong curiosity about learning by building.",
    topics: ["Learning AI", "Hackathons", "School projects"],
    interests: ["AI tools", "Learning by building"],
    memorable_details: [
      "Two members were Ghanaian and exploring new AI tools.",
      "They wanted faster ways to turn ideas into working projects.",
    ],
    suggested_follow_up:
      "Connect and ask what they ended up building after the event.",
    reconnect_priority: "medium",
    raw_json: {
      collaboration_opportunities: [
        "Invite them to test Echo at their next student event.",
      ],
    },
    created_at: DEMO_CREATED_AT,
  },
];

const demoEventInsight: EventInsight = {
  id: "demo-event-insight",
  event_id: DEMO_EVENT_ID,
  summary:
    "You met engineers, organisers, students, and builders while testing Echo as a real event memory system.",
  key_topics: [
    "Cursor",
    "AI agents",
    "Hackathons",
    "Networking",
    "AI infrastructure",
  ],
  patterns: [
    "Several people were interested in practical AI tools.",
    "Early-career builders wanted faster ways to learn by building.",
  ],
  missed_opportunities: [],
  recommended_next_actions: [
    "Reconnect with organisers first.",
    "Follow up with builders who showed interest in Echo.",
    "Share a short Echo demo with the people who offered product feedback.",
  ],
  raw_json: {
    overall_confidence: 0.88,
  },
  created_at: DEMO_CREATED_AT,
};

export function getDemoMemory(): EventMemoryData {
  return {
    people: demoPeople,
    eventInsight: demoEventInsight,
    isDemo: true,
  };
}

export const isDemoMemoryEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_MEMORY === "true";
