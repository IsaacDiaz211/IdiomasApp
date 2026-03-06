export const supportedVoices: Record<string, string> = {
  es: process.env.MINIMAX_VOICE_ES || "Spanish_CaptivatingStoryteller",
  en: process.env.MINIMAX_VOICE_EN || "English_CaptivatingStoryteller",
  pt: process.env.MINIMAX_VOICE_PT || "Portuguese_Solemn_Narrator_v1",
  zh: process.env.MINIMAX_VOICE_ZH || "Chinese (Mandarin)_Southern_Young_Man",
  vi: process.env.MINIMAX_VOICE_VI || "Vietnamese_Professional_Guide_v6"
};

export const minimaxLanguageBoostByLang: Record<string, string> = {
  es: "Spanish",
  en: "English",
  pt: "Portuguese",
  zh: "Chinese",
  vi: "Vietnamese"
};
