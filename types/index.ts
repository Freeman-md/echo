export interface Event {
  id: string;
  user_id: string | null;
  device_session_id: string;
  name: string | null;
  location: string | null;
  context: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Transcript {
  id: string;
  event_id: string;
  raw_text: string;
  source: string;
  created_at: string;
}

export interface PersonMemory {
  id: string;
  event_id: string;
  name: string | null;
  inferred_role: string | null;
  company: string | null;
  confidence: number | null;
  summary: string | null;
  topics: string[] | null;
  interests: string[] | null;
  memorable_details: string[] | null;
  suggested_follow_up: string | null;
  reconnect_priority: string | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
}

export interface EventInsight {
  id: string;
  event_id: string;
  summary: string | null;
  key_topics: string[] | null;
  patterns: string[] | null;
  missed_opportunities: string[] | null;
  recommended_next_actions: string[] | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
}
