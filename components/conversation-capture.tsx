"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  AUDIO_FILE_ACCEPT,
  validateAudioFile,
} from "@/lib/audio/audio-file";
import {
  AudioRecordingError,
  startAudioRecording,
  type AudioRecordingSession,
} from "@/lib/audio/browser-recorder";
import {
  requestTranscription,
  TranscriptionRequestError,
} from "@/lib/transcription/request-transcription";
import {
  createTranscript,
  listTranscriptsForEvent,
} from "@/lib/transcripts/transcript-data";
import type { Transcript } from "@/types";
import type { TranscriptSource } from "@/types/conversation-capture";

interface ConversationCaptureProps {
  eventId: string;
  onCaptureActivityChange: (isActive: boolean) => void;
}

type CaptureStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "stopping"
  | "uploading"
  | "transcribing"
  | "saving"
  | "success"
  | "error";

type CaptureFailureKind =
  | "microphone"
  | "recording"
  | "upload"
  | "openai"
  | "supabase";

interface CaptureFailure {
  kind: CaptureFailureKind;
  message: string;
}

interface RetryAudio {
  file: File;
  source: Exclude<TranscriptSource, "manual">;
}

interface RetryTranscript {
  id: string;
  rawText: string;
  source: TranscriptSource;
}

const ACTIVE_CAPTURE_STATES = new Set<CaptureStatus>([
  "requesting",
  "recording",
  "stopping",
  "uploading",
  "transcribing",
  "saving",
]);

const FAILURE_TITLES: Record<CaptureFailureKind, string> = {
  microphone: "Microphone unavailable",
  recording: "Recording failed",
  upload: "Upload failed",
  openai: "OpenAI transcription failed",
  supabase: "Transcript save failed",
};

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    ...(hours > 0 ? [hours.toString().padStart(2, "0")] : []),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

function formatBatchTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function MicrophoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <rect
        x="8"
        y="3"
        width="8"
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CaptureProgress({
  status,
  batchNumber,
}: {
  status: CaptureStatus;
  batchNumber: number;
}) {
  if (
    status !== "uploading" &&
    status !== "transcribing" &&
    status !== "saving"
  ) {
    return null;
  }

  const activeIndex =
    status === "uploading" ? 0 : status === "transcribing" ? 1 : 2;
  const steps = ["Upload", "Transcribe", "Save"];

  return (
    <ol
      aria-label={`Conversation batch ${batchNumber} progress`}
      className="mt-5 grid grid-cols-3 gap-2"
    >
      {steps.map((step, index) => (
        <li key={step} className="min-w-0">
          <span
            className={`block h-1 rounded-full transition ${
              index < activeIndex
                ? "bg-emerald-300/70"
                : index === activeIndex
                  ? "animate-pulse bg-violet-300"
                  : "bg-white/[0.07]"
            }`}
          />
          <span
            className={`mt-2 block text-center text-[0.65rem] font-medium uppercase tracking-[0.12em] ${
              index <= activeIndex ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ConversationCapture({
  eventId,
  onCaptureActivityChange,
}: ConversationCaptureProps) {
  const recorderRef = useRef<AudioRecordingSession | null>(null);
  const saveInFlightRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualTranscript, setManualTranscript] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [savedTranscript, setSavedTranscript] = useState<Transcript | null>(
    null,
  );
  const [failure, setFailure] = useState<CaptureFailure | null>(null);
  const [retryAudio, setRetryAudio] = useState<RetryAudio | null>(null);
  const [retryTranscript, setRetryTranscript] =
    useState<RetryTranscript | null>(null);
  const [savedSegments, setSavedSegments] = useState<Transcript[]>([]);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  useEffect(() => {
    return () => recorderRef.current?.cancel();
  }, []);

  useEffect(() => {
    let active = true;

    listTranscriptsForEvent(eventId)
      .then((segments) => {
        if (!active) return;
        setSavedSegments((current) => {
          const byId = new Map(
            [...segments, ...current].map((segment) => [segment.id, segment]),
          );
          return [...byId.values()].sort(
            (left, right) =>
              new Date(left.created_at).getTime() -
              new Date(right.created_at).getTime(),
          );
        });
        setSegmentsError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSegmentsError(
          error instanceof Error
            ? error.message
            : "Could not load earlier conversation batches.",
        );
      });

    return () => {
      active = false;
    };
  }, [eventId]);

  function transition(nextStatus: CaptureStatus) {
    setStatus(nextStatus);
    onCaptureActivityChange(ACTIVE_CAPTURE_STATES.has(nextStatus));
  }

  function showFailure(kind: CaptureFailureKind, message: string) {
    setFailure({ kind, message });
    transition("error");
  }

  function resetCapture() {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDurationSeconds(0);
    setUploadProgress(0);
    setManualTranscript("");
    setTranscriptPreview("");
    setSavedTranscript(null);
    setFailure(null);
    setRetryAudio(null);
    setRetryTranscript(null);
    transition("idle");
  }

  async function saveTranscript(
    rawText: string,
    source: TranscriptSource,
    transcriptId = crypto.randomUUID(),
  ) {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    const transcript = rawText.trim();
    setFailure(null);
    setTranscriptPreview(transcript);
    setRetryTranscript({ id: transcriptId, rawText: transcript, source });
    transition("saving");

    try {
      const saved = await createTranscript({
        id: transcriptId,
        eventId,
        rawText: transcript,
        source,
      });
      setSavedTranscript(saved);
      setSavedSegments((current) => [
        ...current.filter((segment) => segment.id !== saved.id),
        saved,
      ]);
      setRetryAudio(null);
      setRetryTranscript(null);
      setFailure(null);
      setSegmentsError(null);
      transition("success");
    } catch (error) {
      showFailure(
        "supabase",
        error instanceof Error
          ? error.message
          : "Supabase could not save this transcript. Retry without recording again.",
      );
    } finally {
      saveInFlightRef.current = false;
    }
  }

  async function processAudio(
    file: File,
    source: Exclude<TranscriptSource, "manual">,
  ) {
    const validationError = validateAudioFile(file);
    if (validationError) {
      setRetryAudio(null);
      showFailure("upload", validationError.message);
      return;
    }

    setFailure(null);
    setSavedTranscript(null);
    setTranscriptPreview("");
    setRetryTranscript(null);
    setRetryAudio({ file, source });
    setUploadProgress(0);
    transition("uploading");

    let transcript: string;

    try {
      const response = await requestTranscription(file, {
        onUploadProgress: setUploadProgress,
        onUploadComplete: () => transition("transcribing"),
      });
      transcript = response.transcript;
    } catch (error) {
      if (error instanceof TranscriptionRequestError) {
        showFailure(
          error.code === "TRANSCRIPTION_FAILED" ? "openai" : "upload",
          error.message,
        );
      } else {
        showFailure(
          "upload",
          "The audio upload failed. Check your connection and try again.",
        );
      }
      return;
    }

    await saveTranscript(transcript, source);
  }

  async function startRecording() {
    setFailure(null);
    setSavedTranscript(null);
    setTranscriptPreview("");
    setRetryAudio(null);
    setRetryTranscript(null);
    setDurationSeconds(0);
    transition("requesting");

    try {
      const session = await startAudioRecording({
        onDurationChange: setDurationSeconds,
        onRecordingError: (error) => {
          recorderRef.current = null;
          showFailure("recording", error.message);
        },
      });
      recorderRef.current = session;
      transition("recording");
    } catch (error) {
      if (error instanceof AudioRecordingError) {
        showFailure(
          error.code === "RECORDING_FAILED" ? "recording" : "microphone",
          error.message,
        );
      } else {
        showFailure(
          "recording",
          "Echo could not start recording. Upload audio or paste a transcript instead.",
        );
      }
    }
  }

  async function stopRecording() {
    const session = recorderRef.current;
    if (!session) return;

    transition("stopping");

    try {
      const recording = await session.stop();
      recorderRef.current = null;
      setDurationSeconds(recording.durationSeconds);
      await processAudio(recording.file, "microphone");
    } catch (error) {
      recorderRef.current = null;
      showFailure(
        "recording",
        error instanceof Error
          ? error.message
          : "Echo could not finish this recording. Try again or upload audio.",
      );
    }
  }

  function handleAudioUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    void processAudio(file, "upload");
  }

  function handleManualSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualTranscript.trim()) return;
    void saveTranscript(manualTranscript, "manual");
  }

  function retryLastStep() {
    if (failure?.kind === "supabase" && retryTranscript) {
      void saveTranscript(
        retryTranscript.rawText,
        retryTranscript.source,
        retryTranscript.id,
      );
      return;
    }

    if (retryAudio) {
      void processAudio(retryAudio.file, retryAudio.source);
    }
  }

  const isBusy = ACTIVE_CAPTURE_STATES.has(status);
  const isRecording = status === "recording";
  const batchNumber = savedSegments.length + 1;
  const hasAudioRetry =
    Boolean(retryAudio) &&
    (failure?.kind === "upload" || failure?.kind === "openai");

  const statusLabel =
    status === "requesting"
      ? `Batch ${batchNumber} · Requesting microphone`
      : status === "recording"
        ? `Batch ${batchNumber} · ${formatDuration(durationSeconds)}`
        : status === "stopping"
          ? `Batch ${batchNumber} · Preparing audio`
          : status === "uploading"
            ? `Batch ${batchNumber} · Uploading ${uploadProgress}%`
            : status === "transcribing"
              ? `Batch ${batchNumber} · Transcribing`
              : status === "saving"
                ? `Batch ${batchNumber} · Saving`
                : status === "success"
                  ? `${savedSegments.length} ${savedSegments.length === 1 ? "batch" : "batches"} saved`
                  : status === "error"
                    ? "Capture needs attention"
                    : savedSegments.length > 0
                      ? `${savedSegments.length} ${savedSegments.length === 1 ? "batch" : "batches"} captured`
                      : "Ready to capture";

  return (
    <div className="rounded-[1.75rem] border border-white/[0.07] bg-black/20 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Continuous event memory
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Echo captures the room in moments.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Capture short conversation batches throughout the event. Each one
            joins the same growing event memory.
          </p>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs text-slate-300"
        >
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${
              isRecording
                ? "animate-pulse bg-rose-300"
                : status === "success"
                  ? "bg-emerald-300"
                  : isBusy
                    ? "animate-pulse bg-violet-300"
                    : status === "error"
                      ? "bg-amber-300"
                      : "bg-slate-600"
            }`}
          />
          {statusLabel}
        </div>
      </div>

      <CaptureProgress status={status} batchNumber={batchNumber} />

      {status !== "success" && (
        <>
          <div
            className={`mt-6 rounded-2xl border p-5 text-center transition ${
              isRecording
                ? "border-rose-300/20 bg-rose-300/[0.045]"
                : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
                isRecording
                  ? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200"
                  : "border-violet-300/15 bg-violet-300/[0.055] text-violet-200"
              }`}
            >
              <MicrophoneIcon />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-200">
              {isRecording
                ? `Capturing conversation batch ${batchNumber}`
                : `Capture conversation batch ${batchNumber}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isRecording
                ? `Recording duration ${formatDuration(durationSeconds)}`
                : "Your browser will ask for microphone access."}
            </p>

            {isRecording ? (
              <button
                type="button"
                onClick={() => void stopRecording()}
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-rose-200/20 bg-rose-200/[0.09] px-6 text-sm font-semibold text-rose-100 transition hover:bg-rose-200/[0.14]"
              >
                <span className="mr-2 h-2.5 w-2.5 rounded-sm bg-rose-200" />
                Stop Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startRecording()}
                disabled={isBusy}
                className="button-primary mt-5 justify-center disabled:cursor-wait disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                {status === "requesting"
                  ? "Opening microphone…"
                  : "Capture Conversation Batch"}
              </button>
            )}
          </div>

          {failure && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-rose-300/10 bg-rose-300/[0.05] px-4 py-4"
            >
              <p className="text-sm font-semibold text-rose-100">
                {FAILURE_TITLES[failure.kind]}
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-100/70">
                {failure.message}
              </p>
              {(hasAudioRetry ||
                (failure.kind === "supabase" && retryTranscript)) && (
                <button
                  type="button"
                  onClick={retryLastStep}
                  className="button-secondary mt-3"
                >
                  {failure.kind === "supabase"
                    ? "Retry Save"
                    : "Retry Transcription"}
                </button>
              )}
            </div>
          )}

          {transcriptPreview && (
            <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Transcript preview
              </p>
              <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {transcriptPreview}
              </p>
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-slate-600">
              Other capture methods
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex min-h-28 items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 transition ${
                isBusy || isRecording
                  ? "cursor-not-allowed opacity-45"
                  : "cursor-pointer hover:border-white/20 hover:bg-white/[0.035]"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200">
                ↑
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-200">
                  Upload audio
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  MP3, M4A, WAV, WebM, or another supported format under 25 MB.
                </span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={AUDIO_FILE_ACCEPT}
                disabled={isBusy || isRecording}
                onChange={handleAudioUpload}
                className="sr-only"
              />
            </label>

            <form
              onSubmit={handleManualSave}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <label
                htmlFor="manual-transcript"
                className="text-sm font-medium text-slate-200"
              >
                Paste transcript
              </label>
              <textarea
                id="manual-transcript"
                value={manualTranscript}
                onChange={(event) => setManualTranscript(event.target.value)}
                disabled={isBusy || isRecording}
                rows={3}
                placeholder="Developer fallback…"
                className="event-field mt-3 resize-y text-sm leading-6 disabled:cursor-not-allowed disabled:opacity-45"
              />
              <button
                type="submit"
                disabled={
                  isBusy || isRecording || !manualTranscript.trim()
                }
                className="button-secondary mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save Transcript
              </button>
            </form>
          </div>
        </>
      )}

      {status === "success" && savedTranscript && (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-300/12 bg-emerald-300/[0.045] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200">
              ✓
            </span>
            <div>
              <p className="text-base font-semibold text-emerald-100">
                Conversation captured
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-100/60">
                Batch {savedSegments.length} is saved and linked to this event.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Transcript preview
              </p>
              <span className="rounded-full border border-white/[0.06] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-slate-500">
                {savedTranscript.source}
              </span>
            </div>
            <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {savedTranscript.raw_text}
            </p>
          </div>

          <button
            type="button"
            onClick={resetCapture}
            className="button-primary mt-5 w-full justify-center"
          >
            Capture another batch
            <span aria-hidden="true">→</span>
          </button>
          <p className="mt-3 text-center text-xs text-slate-600">
            Keep the event active and capture moments whenever they matter.
          </p>
        </div>
      )}

      {(savedSegments.length > 0 || segmentsError) && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                Event transcript
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-200">
                {savedSegments.length} conversation{" "}
                {savedSegments.length === 1 ? "batch" : "batches"} captured
              </h3>
            </div>
            <span className="text-xs text-emerald-300/60">Saved</span>
          </div>

          {segmentsError && (
            <p className="mt-3 rounded-xl border border-amber-200/10 bg-amber-200/[0.04] px-3 py-2 text-xs leading-5 text-amber-100/65">
              {segmentsError}
            </p>
          )}

          {savedSegments.length > 0 && (
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {savedSegments.map((segment, index) => (
                <details
                  key={segment.id}
                  className="rounded-xl border border-white/[0.055] bg-white/[0.02] px-3.5 py-3"
                >
                  <summary className="cursor-pointer list-none text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      Batch {index + 1}
                    </span>
                    <span className="ml-2 text-slate-600">
                      {formatBatchTime(segment.created_at)} · {segment.source}
                    </span>
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap border-t border-white/[0.05] pt-3 text-xs leading-6 text-slate-500">
                    {segment.raw_text}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
