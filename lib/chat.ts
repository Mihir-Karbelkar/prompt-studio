export type ModelOption = {
  id: string;
  name: string;
  description: string;
  /** Whether the model supports server-side refusal fallbacks (`fallbacks: "default"`). */
  fallbacks: boolean;
};

export const MODELS: ModelOption[] = [
  {
    id: "claude-opus-5-5",
    name: "Opus 5.5",
    description: "Most capable for complex work",
    fallbacks: true,
  },
  {
    id: "claude-sonnet-5-5",
    name: "Sonnet 5.5",
    description: "Smart, efficient model for everyday use",
    fallbacks: true,
  },
  {
    id: "claude-haiku-5-5",
    name: "Haiku 5.5",
    description: "Fastest model for quick answers",
    fallbacks: false,
  },
  {
    id: "claude-fable-5-1",
    name: "Fable 5.1",
    description: "Frontier reasoning for the hardest problems",
    fallbacks: true,
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const findModel = (id: unknown) => MODELS.find((m) => m.id === id);

export const SYSTEM_PROMPT =
  "You are a helpful, concise assistant. Format answers with Markdown when it aids readability.";

export const KEY_STORAGE = "anthropic-api-key";
export const MODEL_STORAGE = "claude-model";
