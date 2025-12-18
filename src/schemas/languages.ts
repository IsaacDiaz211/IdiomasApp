export const supportedLanguages = [
  "spanish",
  "english",
  "portuguese",
  "chinese",
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];
