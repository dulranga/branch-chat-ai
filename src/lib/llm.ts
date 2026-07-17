import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { resolveProviderModel } from "@/lib/provider-utils";

let systemModel: LanguageModel | null = null;

function getSystemModel(): LanguageModel {
  if (systemModel) return systemModel;

  const provider = process.env.SYSTEM_MODEL_PROVIDER ?? "openai";
  const model = process.env.SYSTEM_MODEL_NAME ?? "gpt-4o-mini";
  const apiKey = process.env.SYSTEM_MODEL_API_KEY ?? process.env.OPENAI_API_KEY ?? "";

  if (provider === "openai") {
    const api = createOpenAI({ apiKey });
    systemModel = api.chat(model);
    return systemModel;
  }

  throw new Error(
    `System model provider "${provider}" not supported. Use "openai" or set SYSTEM_MODEL_PROVIDER to a supported provider.`,
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
