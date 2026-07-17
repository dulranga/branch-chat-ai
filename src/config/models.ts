import type { ModelProviderConfig } from "@/lib/types";

const modelCatalog: Record<string, ModelProviderConfig> = {
  openai: {
    package: "@ai-sdk/openai",
    constructor: "createOpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
  },
  anthropic: {
    package: "@ai-sdk/anthropic",
    constructor: "createAnthropic",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
  },
  google: {
    package: "@ai-sdk/google",
    constructor: "createGoogleGenerativeAI",
    models: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"],
  },
  groq: {
    package: "@ai-sdk/groq",
    constructor: "createGroq",
    models: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b"],
  },
  mistral: {
    package: "@ai-sdk/mistral",
    constructor: "createMistral",
    models: ["mistral-large-latest", "mistral-small-latest"],
  },
};

export function getModelCatalog() {
  return modelCatalog;
}

export function getProviders() {
  return Object.keys(modelCatalog);
}

export function getProviderConfig(provider: string) {
  return modelCatalog[provider] ?? null;
}

export function getModelsForProvider(provider: string) {
  return modelCatalog[provider]?.models ?? [];
}

export function formatProviderName(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
