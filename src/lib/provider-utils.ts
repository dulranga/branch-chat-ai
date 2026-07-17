import type { LanguageModel } from "ai";
import { getProviderConfig } from "@/config/models";

export async function resolveProviderModel(
  provider: string,
  model: string,
  apiKey: string,
): Promise<LanguageModel> {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  let mod: Record<string, unknown>;
  try {
    mod = await import(/* @vite-ignore */ config.package);
  } catch {
    throw new Error(
      `Package ${config.package} is not installed. Install it to use ${provider} models.`,
    );
  }

  const factory = mod[config.constructor] as (opts: {
    apiKey: string;
    baseURL?: string;
  }) => { chat: (model: string) => unknown };
  if (!factory) {
    throw new Error(
      `Constructor ${config.constructor} not found in package ${config.package}`,
    );
  }

  const instance = factory({ apiKey, baseURL: config.baseURL });
  return instance.chat(model) as LanguageModel;
}
