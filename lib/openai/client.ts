import "server-only";

import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
      timeout: 25_000,
      maxRetries: 1,
    });
  }

  return openAIClient;
}
