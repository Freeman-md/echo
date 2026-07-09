"use client";

import { useState, type FormEvent } from "react";

import { getSupabaseClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const supabase = getSupabaseClient();
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.07]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.08]" />

      <section className="glass-card relative w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055]">
            <span className="absolute h-5 w-5 rounded-full border border-violet-300/70" />
            <span className="absolute h-8 w-8 rounded-full border border-violet-300/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-200 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
          </span>
          <div>
            <p className="font-semibold text-white">Echo</p>
            <p className="text-xs text-slate-500">Your memory of the room</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            {mode === "sign-in" ? "Welcome back" : "Start remembering"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-white">
            {mode === "sign-in" ? "Sign in to Echo" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your events, transcripts, and memories stay connected to your
            account.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="event-field mt-2 text-base sm:text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Password</span>
            <input
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="event-field mt-2 text-base sm:text-sm"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-rose-300/10 bg-rose-300/[0.05] px-4 py-3 text-sm text-rose-100/80"
            >
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.05] px-4 py-3 text-sm text-emerald-100/75">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary w-full justify-center disabled:cursor-wait disabled:opacity-55"
          >
            {isSubmitting
              ? "One moment…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((current) =>
              current === "sign-in" ? "sign-up" : "sign-in",
            );
            setError(null);
            setMessage(null);
          }}
          className="mx-auto mt-6 block text-sm text-slate-500 transition hover:text-slate-300"
        >
          {mode === "sign-in"
            ? "New to Echo? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
