import type { EventClue, EventDraft } from "@/types/event-lifecycle";

function titleFromWords(value: string): string {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\btickets?\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (/^(ai|ml|api)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function inferNameFromUrl(value: string): string {
  try {
    const url = new URL(value);
    const pathParts = url.pathname
      .split("/")
      .map((part) => decodeURIComponent(part))
      .filter(Boolean);
    const pathName = titleFromWords(pathParts.at(-1) ?? "");

    if (pathName && !/^(events?|e)$/i.test(pathName)) return pathName;

    const hostName = titleFromWords(url.hostname.replace(/^www\./, ""));
    return hostName ? `${hostName} Event` : "Networking event";
  } catch {
    return "Networking event";
  }
}

export function isEventUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Fast, deterministic inference retained as a no-network fallback.
 * The enrichment API uses this whenever webpage or OpenAI work cannot finish.
 */
export function inferEventDraft(clue: EventClue): EventDraft {
  if (clue.type === "url") {
    return {
      name: inferNameFromUrl(clue.value),
      location: "",
      context: `Original event link: ${clue.value}\n\nEvent details are awaiting enrichment.`,
      sourceClue: clue.value,
      sourceType: "url",
    };
  }

  if (clue.type === "image") {
    const fileName = clue.fileName ?? clue.value;
    const inferredName = titleFromWords(fileName);
    const metadata = [
      clue.fileType,
      clue.fileSize ? `${Math.max(1, Math.round(clue.fileSize / 1024))} KB` : "",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      name:
        inferredName && !/^img \d+$/i.test(inferredName)
          ? inferredName
          : "Event from screenshot",
      location: "",
      context: `Screenshot attached: ${fileName}${metadata ? ` (${metadata})` : ""}.\n\nEvent details are awaiting image understanding.`,
      sourceClue: fileName,
      sourceType: "image",
    };
  }

  const text = clue.value.trim();
  return {
    name: text,
    location: "",
    context: `Original clue: ${text}`,
    sourceClue: text,
    sourceType: "text",
  };
}
