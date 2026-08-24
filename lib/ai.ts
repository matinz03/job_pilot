import OpenAI from "openai";

// The gateway is OpenAI-compatible, so switching providers is a base URL and model change,
// never a code change. Both come from the environment.
const DEFAULT_BASE_URL = "https://api.llmapi.ai/v1";

export const AI_MODEL = process.env.LLM_MODEL ?? "gpt-5.6-luna";

export function createAiClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  return new OpenAI({ apiKey, baseURL: process.env.LLM_API_URL ?? DEFAULT_BASE_URL });
}
