import { getSupabaseClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export async function getCurrentSession(): Promise<Session> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sign in to continue.");
  }

  return session;
}

export async function getCurrentAccessToken(): Promise<string> {
  return (await getCurrentSession()).access_token;
}
