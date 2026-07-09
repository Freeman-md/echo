"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { requestEventEnrichment } from "@/lib/event-enrichment/request-event-enrichment";
import {
  inferEventDraft,
  isEventUrl,
} from "@/lib/events/infer-event-draft";
import type { EventClue, EventDraft } from "@/types/event-lifecycle";

interface EventClueInputProps {
  onDraftCreated: (draft: EventDraft) => void;
  onCancel: () => void;
}

export function EventClueInput({
  onDraftCreated,
  onCancel,
}: EventClueInputProps) {
  const [clue, setClue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClueChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setClue(value);

    if (value && image) {
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;
    setImage(selectedImage);
    if (selectedImage) setClue("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = clue.trim();
    if (!value && !image) return;

    const eventClue: EventClue = image
      ? {
          type: "image",
          value: image.name,
          fileName: image.name,
          fileType: image.type,
          fileSize: image.size,
        }
      : {
          type: isEventUrl(value) ? "url" : "text",
          value,
        };

    setIsEnriching(true);

    try {
      const response = await requestEventEnrichment(
        eventClue,
        image ?? undefined,
      );
      onDraftCreated(response.draft);
    } catch {
      onDraftCreated({
        ...inferEventDraft(eventClue),
        enrichmentSource: "fallback",
        enrichmentWarning:
          "Echo could not reach event enrichment, so it created a quick draft from your original clue.",
      });
    }
  }

  if (isEnriching) {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className="mx-auto flex min-h-[40rem] w-full max-w-2xl flex-col items-center justify-center py-14 text-center sm:py-20"
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span className="absolute h-full w-full animate-ping rounded-full border border-violet-300/10 [animation-duration:2.4s]" />
          <span className="absolute h-20 w-20 rounded-full border border-violet-300/15 bg-violet-300/[0.035]" />
          <span className="absolute h-12 w-12 rounded-full border border-violet-200/25 bg-violet-300/[0.07]" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-violet-100 shadow-[0_0_22px_rgba(196,181,253,0.9)]" />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
          Building your draft
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Echo is learning about this event…
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
          Reading the clue, finding useful context, and preparing your
          networking focus.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[36rem] w-full max-w-2xl flex-col justify-center py-14 sm:py-20">
      <button
        type="button"
        onClick={onCancel}
        className="mb-8 flex w-fit items-center gap-2 text-sm text-slate-500 transition hover:text-slate-300"
      >
        <span aria-hidden="true">←</span>
        Back
      </button>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
        Start an event
      </p>
      <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-5xl">
        Give Echo one clue about the room.
      </h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">
        A link, a screenshot, or a few words is enough. You can make a quick
        correction before Echo begins.
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="glass-card mt-9 rounded-[1.75rem] p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {["Paste event link", "Upload screenshot", "Type a short clue"].map(
            (option) => (
              <span
                key={option}
                className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[0.7rem] text-slate-500"
              >
                {option}
              </span>
            ),
          )}
        </div>

        <label htmlFor="event-clue" className="sr-only">
          Event link or short clue
        </label>
        <input
          id="event-clue"
          value={clue}
          onChange={handleClueChange}
          placeholder="Google AI Builder Night or https://…"
          autoFocus
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/35 focus:ring-4 focus:ring-violet-400/[0.06]"
        />

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-slate-600">
            or
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3.5 transition hover:border-white/20 hover:bg-white/[0.035]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-lg text-violet-200">
            +
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-200">
              {image?.name ?? "Choose event screenshot"}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {image
                ? "Ready for visual understanding"
                : "Echo can understand an event screenshot"}
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
        </label>

        <button
          type="submit"
          disabled={!clue.trim() && !image}
          className="button-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create Event Draft
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}
