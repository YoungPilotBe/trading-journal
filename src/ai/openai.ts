import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openai = createOpenAI({ apiKey: import.meta.env.VITE_OPENAI_KEY });

export const model = createOpenAICompatible({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  baseURL: "https://api.openai.com/v1/",
  name: "gpt-4o",
})("gpt-4o");
