// Augment OpenAI SDK types to allow Qwen-specific `translation_options`.
// This keeps calling sites typed instead of using `any`.
declare module "openai" {
  interface ChatCompletionCreateParamsBase {
    translation_options?: {
      source_lang?: string;
      target_lang?: string;
      [key: string]: unknown;
    };
  }
}

export {};
