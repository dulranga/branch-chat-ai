export type ReasoningLevel =
  | "provider-default"
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export const REASONING_LEVELS: {
  value: ReasoningLevel;
  label: string;
}[] = [
  { value: "provider-default", label: "Provider default" },
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
];

type ProviderOptions = Record<string, Record<string, string>>;

const REASONING_MAP: Record<string, ProviderOptions> = {
  "provider-default": {},
  none: {},
  minimal: { openai: { reasoningEffort: "low" } },
  low: { openai: { reasoningEffort: "low" } },
  medium: { openai: { reasoningEffort: "medium" } },
  high: { openai: { reasoningEffort: "high" } },
  xhigh: { openai: { reasoningEffort: "high" } },
};

export function getProviderOptions(
  reasoningLevel: string | null,
  provider: string,
): ProviderOptions | undefined {
  const level = reasoningLevel ?? "provider-default";
  const base = REASONING_MAP[level];
  if (!base) return undefined;

  if (Object.keys(base).length === 0) return undefined;

  return base;
}
