import { createOpenAI } from "@ai-sdk/openai";

export interface LLMConfig {
  name: string;
  model: string;
  baseURL: string;
  apiKey: string;
}

const OPENROUTER: LLMConfig = {
  name: "OpenRouter",
  model: "openrouter/free",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
};

const OLLAMA: LLMConfig = {
  name: "Ollama",
  model: "gemma4:12b",
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
};

const activeConfig: LLMConfig = OPENROUTER;

const provider = createOpenAI({
  baseURL: activeConfig.baseURL,
  apiKey: activeConfig.apiKey,
});

export function getModel() {
  return provider.chat(activeConfig.model);
}
