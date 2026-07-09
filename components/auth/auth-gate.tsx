"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { AuthScreen } from "@/components/auth/auth-screen";
import { EchoApp } from "@/components/echo-app";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="text-center" aria-live="polite">
          <span className="mx-auto block h-2.5 w-2.5 animate-pulse rounded-full bg-violet-200 shadow-[0_0_18px_rgba(196,181,253,0.8)]" />
          <p className="mt-4 text-sm text-slate-500">Opening Echo…</p>
        </div>
      </main>
    );
  }

  return user ? <EchoApp key={user.id} user={user} /> : <AuthScreen />;
}
