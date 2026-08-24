import OpenAI from "openai";

// OpenCode Zen is OpenAI-compatible, so the official SDK talks to it with only a baseURL change.
const ZEN_BASE_URL = "https://opencode.ai/zen/v1";

export const AI_MODEL = process.env.AI_MODEL ?? "gpt-5.6-luna";

export function createAiClient(): OpenAI {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) {
    throw new Error("OPENCODE_API_KEY is not configured");
  }

  return new OpenAI({ apiKey, baseURL: ZEN_BASE_URL });
}
