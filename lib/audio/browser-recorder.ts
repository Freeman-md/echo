export type AudioRecordingErrorCode =
  | "MICROPHONE_DENIED"
  | "MICROPHONE_UNAVAILABLE"
  | "RECORDING_FAILED";

export class AudioRecordingError extends Error {
  constructor(
    public readonly code: AudioRecordingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AudioRecordingError";
  }
}

export interface RecordedAudio {
  file: File;
  durationSeconds: number;
}

export interface AudioRecordingSession {
  stop: () => Promise<RecordedAudio>;
  cancel: () => void;
}

interface StartAudioRecordingOptions {
  onDurationChange: (durationSeconds: number) => void;
  onRecordingError: (error: AudioRecordingError) => void;
}

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function preferredMimeType(): string | undefined {
  return MIME_TYPE_CANDIDATES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}

function recordingExtension(mimeType: string): string {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes("mp4")) return "mp4";
  if (normalizedMimeType.includes("ogg")) return "ogg";
  if (normalizedMimeType.includes("wav")) return "wav";
  return "webm";
}

function microphoneError(error: unknown): AudioRecordingError {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return new AudioRecordingError(
        "MICROPHONE_DENIED",
        "Microphone access was denied. Allow access in your browser, upload audio, or paste a transcript.",
      );
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return new AudioRecordingError(
        "MICROPHONE_UNAVAILABLE",
        "No microphone is available. Upload audio or paste a transcript instead.",
      );
    }
  }

  return new AudioRecordingError(
    "RECORDING_FAILED",
    "Echo could not start recording. Try again, upload audio, or paste a transcript.",
  );
}

export function isMicrophoneRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export async function startAudioRecording({
  onDurationChange,
  onRecordingError,
}: StartAudioRecordingOptions): Promise<AudioRecordingSession> {
  if (!isMicrophoneRecordingSupported()) {
    throw new AudioRecordingError(
      "MICROPHONE_UNAVAILABLE",
      "This browser cannot record audio. Upload audio or paste a transcript instead.",
    );
  }

  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (error) {
    throw microphoneError(error);
  }

  const mimeType = preferredMimeType();
  let recorder: MediaRecorder;

  try {
    recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 48_000,
    });
  } catch {
    for (const track of stream.getTracks()) track.stop();
    throw new AudioRecordingError(
      "RECORDING_FAILED",
      "Echo could not initialize the recorder. Upload audio or paste a transcript instead.",
    );
  }

  const chunks: Blob[] = [];
  const startedAt = Date.now();
  let cancelled = false;
  let durationSeconds = 0;
  let stopResolve: ((audio: RecordedAudio) => void) | null = null;
  let stopReject: ((error: AudioRecordingError) => void) | null = null;
  let failed = false;

  const timer = window.setInterval(() => {
    durationSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1_000));
    onDurationChange(durationSeconds);
  }, 250);

  function cleanup() {
    window.clearInterval(timer);
    for (const track of stream.getTracks()) track.stop();
  }

  function failRecording(error: AudioRecordingError) {
    failed = true;
    cleanup();

    if (stopReject) {
      stopReject(error);
      stopResolve = null;
      stopReject = null;
    } else if (!cancelled) {
      onRecordingError(error);
    }
  }

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  recorder.addEventListener("error", () => {
    failRecording(
      new AudioRecordingError(
        "RECORDING_FAILED",
        "Recording stopped unexpectedly. Try again or use an alternate capture method.",
      ),
    );
  });

  recorder.addEventListener("stop", () => {
    cleanup();

    if (cancelled || failed) return;

    if (!stopResolve || !stopReject) {
      onRecordingError(
        new AudioRecordingError(
          "RECORDING_FAILED",
          "Recording stopped unexpectedly. Try again or use an alternate capture method.",
        ),
      );
      return;
    }

    if (chunks.length === 0) {
      failRecording(
        new AudioRecordingError(
          "RECORDING_FAILED",
          "No audio was captured. Check your microphone and try again.",
        ),
      );
      return;
    }

    durationSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1_000),
    );
    onDurationChange(durationSeconds);

    const outputMimeType =
      recorder.mimeType || mimeType || "audio/webm;codecs=opus";
    const audioBlob = new Blob(chunks, { type: outputMimeType });
    const extension = recordingExtension(outputMimeType);

    stopResolve({
      file: new File(
        [audioBlob],
        `echo-recording-${Date.now()}.${extension}`,
        {
          type: outputMimeType,
          lastModified: Date.now(),
        },
      ),
      durationSeconds,
    });
    stopResolve = null;
    stopReject = null;
  });

  try {
    recorder.start(1_000);
    onDurationChange(0);
  } catch {
    cleanup();
    throw new AudioRecordingError(
      "RECORDING_FAILED",
      "Echo could not begin recording. Try again or use an alternate capture method.",
    );
  }

  return {
    stop() {
      if (recorder.state === "inactive") {
        return Promise.reject(
          new AudioRecordingError(
            "RECORDING_FAILED",
            "The recording is no longer active. Start a new recording.",
          ),
        );
      }

      return new Promise<RecordedAudio>((resolve, reject) => {
        stopResolve = resolve;
        stopReject = reject;

        try {
          recorder.requestData();
          recorder.stop();
        } catch {
          failRecording(
            new AudioRecordingError(
              "RECORDING_FAILED",
              "Echo could not finish this recording. Try again or upload audio.",
            ),
          );
        }
      });
    },
    cancel() {
      cancelled = true;
      cleanup();
      if (recorder.state !== "inactive") recorder.stop();
    },
  };
}
