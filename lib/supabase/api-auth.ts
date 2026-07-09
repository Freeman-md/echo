import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getServerSupabaseClient } from "@/lib/supabase/server";

export class ApiAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiAuthenticationError";
  }
}

export interface AuthenticatedApiContext {
  supabase: SupabaseClient;
  user: User;
}

export async function authenticateApiRequest(
  request: Request,
): Promise<AuthenticatedApiContext> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!accessToken) {
    throw new ApiAuthenticationError("Sign in to continue.");
  }

  const supabase = getServerSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new ApiAuthenticationError(
      "Your session has expired. Sign in again.",
    );
  }

  return { supabase, user };
}
