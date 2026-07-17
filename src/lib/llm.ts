import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { resolveProviderModel } from "@/lib/provider-utils";

let systemModel: LanguageModel | null = null;

function getSystemModel(): LanguageModel {
  if (systemModel) return systemModel;

  const provider = process.env.SYSTEM_MODEL_PROVIDER ?? "openai";

  if (provider === "openai") {
    const model = process.env.SYSTEM_MODEL_NAME ?? "gpt-4o-mini";
    const apiKey = process.env.SYSTEM_MODEL_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
    const api = createOpenAI({ apiKey });
    systemModel = api.chat(model);
    return systemModel;
  }

  if (provider === "openrouter") {
    const model = process.env.SYSTEM_MODEL_NAME ?? "openrouter/free";
    const api = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY ?? "",
      baseURL: "https://openrouter.ai/api/v1",
    });
    systemModel = api.chat(model);
    return systemModel;
  }

  throw new Error(
    `System model provider "${provider}" not supported. Use "openai" or "openrouter".`,
  );
}

export function getSystemModelInstance(): LanguageModel {
  return getSystemModel();
}

export async function getUserModelInstance(
  provider: string,
  model: string,
  apiKey: string,
): Promise<LanguageModel> {
  return resolveProviderModel(provider, model, apiKey);
}
