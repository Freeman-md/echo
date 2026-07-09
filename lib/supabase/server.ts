import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Server-side client for demo-grade Milestone 3 reads and writes.
 * TODO: Replace the anonymous key with authenticated or server-owned sessions
 * when access control is introduced. The current RLS policies are intentionally
 * permissive and do not provide ownership isolation.
 */
export function getServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  if (!serverClient) {
    serverClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return serverClient;
}
