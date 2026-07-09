import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { load } from "cheerio";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_EVIDENCE_CHARACTERS = 12_000;

export interface EventPageEvidence {
  finalUrl: string;
  content: string;
}

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIp(normalized.slice(7));
  }

  if (isIP(normalized) === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    );
  }

  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

async function assertPublicHttpUrl(value: string): Promise<URL> {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only public HTTP event pages can be fetched.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Local event URLs cannot be fetched.");
  }

  const literalVersion = isIP(hostname);
  const addresses = literalVersion
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateIp(address))
  ) {
    throw new Error("Private network event URLs cannot be fetched.");
  }

  return url;
}

async function fetchWithSafeRedirects(value: string): Promise<Response> {
  let currentUrl = await assertPublicHttpUrl(value);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "EchoEventEnrichment/1.0",
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get("location");
    if (!location || redirectCount === MAX_REDIRECTS) {
      throw new Error("The event page redirected too many times.");
    }

    currentUrl = await assertPublicHttpUrl(
      new URL(location, currentUrl).toString(),
    );
  }

  throw new Error("The event page could not be reached.");
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(
    chunks.length === 1
      ? chunks[0]
      : Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
  );
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractReadableContent(html: string, finalUrl: string): string {
  const $ = load(html);

  $(
    "script, style, noscript, nav, footer, header, form, svg, canvas, iframe",
  ).remove();

  const lines = [
    cleanText($("title").first().text()),
    cleanText($('meta[name="description"]').attr("content") ?? ""),
    cleanText($('meta[property="og:title"]').attr("content") ?? ""),
    cleanText($('meta[property="og:description"]').attr("content") ?? ""),
  ];

  $("h1, h2, h3, p, time, [itemprop='location'], [itemprop='startDate']").each(
    (_, element) => {
      lines.push(cleanText($(element).text()).slice(0, 600));
    },
  );

  const uniqueLines = [...new Set(lines.filter((line) => line.length > 1))];
  return [`Page URL: ${finalUrl}`, ...uniqueLines]
    .join("\n")
    .slice(0, MAX_EVIDENCE_CHARACTERS);
}

export async function fetchEventPage(
  value: string,
): Promise<EventPageEvidence> {
  const response = await fetchWithSafeRedirects(value);

  if (!response.ok) {
    throw new Error(`The event page returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("xhtml")) {
    throw new Error("The event URL did not return a readable webpage.");
  }

  const html = await readLimitedBody(response);
  const content = extractReadableContent(html, response.url || value);

  if (content.length < 40) {
    throw new Error("The event page did not contain enough readable content.");
  }

  return {
    finalUrl: response.url || value,
    content,
  };
}
