import { readFileSync } from "fs";
import { join } from "path";
import { load as yamlLoad } from "js-yaml";
import type { LanguageModel } from "ai";
import type { ModelProviderConfig } from "@/lib/types";

let catalog: Record<string, ModelProviderConfig> | null = null;

function loadCatalog(): Record<string, ModelProviderConfig> {
  if (catalog) return catalog;
  const raw = readFileSync(
    join(process.cwd(), "src/config/models.yaml"),
    "utf-8",
  );
  catalog = yamlLoad(raw) as Record<string, ModelProviderConfig>;
  return catalog;
}

export function getModelCatalog() {
  return loadCatalog();
}

export function getProviders() {
  return Object.keys(loadCatalog());
}

export function getProviderConfig(provider: string) {
  return loadCatalog()[provider] ?? null;
}

export function getModelsForProvider(provider: string) {
  return loadCatalog()[provider]?.models ?? [];
}

export function formatProviderName(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

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
  }) => { chat: (model: string) => unknown };
  if (!factory) {
    throw new Error(
      `Constructor ${config.constructor} not found in package ${config.package}`,
    );
  }

  const instance = factory({ apiKey });
  return instance.chat(model) as LanguageModel;
}
