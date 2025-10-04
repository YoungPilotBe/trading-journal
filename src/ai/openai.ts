import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({ apiKey: import.meta.env.VITE_OPENAI_KEY });
