"use client";

import { useState, type FormEvent } from "react";

import type { EventDraft } from "@/types/event-lifecycle";

interface EventDraftReviewProps {
  draft: EventDraft;
  isStarting: boolean;
  error: string | null;
  onBack: () => void;
  onStart: (draft: EventDraft) => void;
}

export function EventDraftReview({
  draft,
  isStarting,
  error,
  onBack,
  onStart,
}: EventDraftReviewProps) {
  const [editedDraft, setEditedDraft] = useState(draft);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onStart(editedDraft);
  }

  return (
    <section className="mx-auto flex min-h-[38rem] w-full max-w-2xl flex-col justify-center py-14 sm:py-20">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 flex w-fit items-center gap-2 text-sm text-slate-500 transition hover:text-slate-300"
      >
        <span aria-hidden="true">←</span>
        Change clue
      </button>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_9px_rgba(196,181,253,0.8)]" />
        {editedDraft.enrichmentSource === "ai"
          ? `AI event draft · ${Math.round(
              (editedDraft.enrichment?.confidence ?? 0) * 100,
            )}% confidence`
          : "Draft ready"}
      </div>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
        Does this feel right?
      </h1>
      <p className="mt-3 text-base leading-7 text-slate-400">
        Echo made a quick first pass. Edit only what matters, or start
        listening now.
      </p>

      <form onSubmit={handleSubmit} className="glass-card mt-8 rounded-[1.75rem] p-5 sm:p-7">
        {editedDraft.enrichmentWarning && (
          <p className="mb-5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.04] px-4 py-3 text-sm leading-6 text-amber-100/75">
            {editedDraft.enrichmentWarning}
          </p>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Event name
            </span>
            <input
              value={editedDraft.name}
              onChange={(event) =>
                setEditedDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              className="event-field text-lg font-medium"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Location <span className="normal-case tracking-normal">(optional)</span>
            </span>
            <input
              value={editedDraft.location}
              onChange={(event) =>
                setEditedDraft((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Add only if useful"
              className="event-field"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Context
            </span>
            <textarea
              value={editedDraft.context}
              onChange={(event) =>
                setEditedDraft((current) => ({
                  ...current,
                  context: event.target.value,
                }))
              }
              rows={4}
              className="event-field resize-none leading-6"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Source clue · {editedDraft.sourceType}
            </p>
            <p className="mt-1 truncate text-sm text-slate-400">
              {editedDraft.sourceClue}
            </p>
          </div>
          <span className="text-violet-300/70" aria-hidden="true">
            ✓
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-rose-300/10 bg-rose-300/[0.05] px-4 py-3 text-sm leading-6 text-rose-100/80"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isStarting || !editedDraft.name.trim()}
          className="button-primary mt-5 w-full justify-center disabled:cursor-wait disabled:opacity-50"
        >
          {isStarting ? "Starting…" : "Start Listening"}
          {!isStarting && <span aria-hidden="true">→</span>}
        </button>
        <p className="mt-3 text-center text-xs text-slate-600">
          This creates the event in Supabase.
        </p>
      </form>
    </section>
  );
}
