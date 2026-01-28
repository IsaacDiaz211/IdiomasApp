import { describe, it, expect } from "bun:test";
import { OpenAIProvider } from "../src/providers/openai.providers";
import { MistralProvider } from "../src/providers/mistral.provider";

type TestTarget = "local" | "railway";
type TestProvider = "openai" | "mistral";

const requiredEnvByProvider: Record<TestProvider, string[]> = {
  openai: ["AI_KEY", "AI_BASE_URL", "AI_MODEL"],
  mistral: ["MISTRAL_API_KEY"]
};

const getProvider = (): TestProvider | null => {
  const provider = process.env.TEST_PROVIDER?.trim().toLowerCase();
  if (provider === "openai" || provider === "mistral") return provider;
  return null;
};

const hasRequiredEnv = (provider: TestProvider): boolean => {
  return requiredEnvByProvider[provider].every((key) => {
    const value = process.env[key];
    return Boolean(value && value.trim().length > 0);
  });
};

const makeDescribe = (enabled: boolean) => (enabled ? describe : describe.skip);

const nonEmptyStrings = (values: string[]) => {
  expect(values.length).toBeGreaterThan(0);
  values.forEach((value) => {
    expect(value.trim().length).toBeGreaterThan(0);
  });
};

export const registerOpenAIProviderTests = (target: TestTarget) => {
  const provider = getProvider();
  const shouldRun =
    process.env.TEST_TARGET === target &&
    provider !== null &&
    hasRequiredEnv(provider);
  const describeFn = makeDescribe(shouldRun);

  describeFn(`Provider integration (${target})`, () => {
    const providerInstance = provider === "mistral"
      ? new MistralProvider()
      : new OpenAIProvider();

    it(
      "detectLanguage returns ISO code",
      async () => {
        const result = await providerInstance.detectLanguage("Hello world.");
        expect(result).toMatch(/^[a-z]{2}$/);
        expect(result).toBe("en");
      },
      { timeout: 30000 }
    );

    it(
      "translateText Spanish to English",
      async () => {
        const result = await providerInstance.translateText("Hola mundo.", "en", "es");
        expect(result.trim().length).toBeGreaterThan(0);
      },
      { timeout: 30000 }
    );

    it(
      "translateText English to Spanish",
      async () => {
        const result = await providerInstance.translateText("Hello world.", "es", "en");
        expect(result.trim().length).toBeGreaterThan(0);
      },
      { timeout: 30000 }
    );

    it(
      "glossText Spanish to English",
      async () => {
        const result = await providerInstance.glossText("Hola mundo.", "en", "es");
        expect(result.originalText.length).toBe(result.glossedWords.length);
        nonEmptyStrings(result.originalText);
        nonEmptyStrings(result.glossedWords);
      },
      { timeout: 45000 }
    );

    it(
      "glossText English to Spanish",
      async () => {
        const result = await providerInstance.glossText("Hello world.", "es", "en");
        expect(result.originalText.length).toBe(result.glossedWords.length);
        nonEmptyStrings(result.originalText);
        nonEmptyStrings(result.glossedWords);
      },
      { timeout: 45000 }
    );

    it(
      "glossChineseText Chinese to Spanish",
      async () => {
        const result = await providerInstance.glossChineseText("你好世界。", "es");
        expect(result.separateWords.length).toBe(result.pinyin.length);
        expect(result.separateWords.length).toBe(result.glossedWords.length);
        nonEmptyStrings(result.separateWords);
        nonEmptyStrings(result.pinyin);
        nonEmptyStrings(result.glossedWords);
      },
      { timeout: 45000 }
    );

    it(
      "glossChineseText Chinese to English",
      async () => {
        const result = await providerInstance.glossChineseText("你好世界。", "en");
        expect(result.separateWords.length).toBe(result.pinyin.length);
        expect(result.separateWords.length).toBe(result.glossedWords.length);
        nonEmptyStrings(result.separateWords);
        nonEmptyStrings(result.pinyin);
        nonEmptyStrings(result.glossedWords);
      },
      { timeout: 45000 }
    );

    it(
      "getGrammarPoints Spanish to English",
      async () => {
        const result = await providerInstance.getGrammarPoints(
          "Hola, esto es una prueba simple.",
          "en",
          "es"
        );
        expect(Array.isArray(result.points)).toBe(true);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.points.length).toBeLessThanOrEqual(3);
        result.points.forEach((point) => {
          expect(point.grammar_point.trim().length).toBeGreaterThan(0);
          expect(point.sentence.trim().length).toBeGreaterThan(0);
          expect(point.explanation.trim().length).toBeGreaterThan(0);
        });
      },
      { timeout: 45000 }
    );

    it(
      "getGrammarPoints English to Spanish",
      async () => {
        const result = await providerInstance.getGrammarPoints(
          "This is a short grammar test.",
          "es",
          "en"
        );
        expect(Array.isArray(result.points)).toBe(true);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.points.length).toBeLessThanOrEqual(3);
        result.points.forEach((point) => {
          expect(point.grammar_point.trim().length).toBeGreaterThan(0);
          expect(point.sentence.trim().length).toBeGreaterThan(0);
          expect(point.explanation.trim().length).toBeGreaterThan(0);
        });
      },
      { timeout: 45000 }
    );

    it(
      "getGrammarPoints Chinese to English",
      async () => {
        const result = await providerInstance.getGrammarPoints(
          "你好，我在学习中文。",
          "en",
          "zh"
        );
        expect(Array.isArray(result.points)).toBe(true);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.points.length).toBeLessThanOrEqual(3);
        result.points.forEach((point) => {
          expect(point.grammar_point.trim().length).toBeGreaterThan(0);
          expect(point.sentence.trim().length).toBeGreaterThan(0);
          expect(point.explanation.trim().length).toBeGreaterThan(0);
        });
      },
      { timeout: 45000 }
    );

    it(
      "getGrammarPoints Chinese to Spanish",
      async () => {
        const result = await providerInstance.getGrammarPoints(
          "你好，我在学习中文。",
          "es",
          "zh"
        );
        expect(Array.isArray(result.points)).toBe(true);
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.points.length).toBeLessThanOrEqual(3);
        result.points.forEach((point) => {
          expect(point.grammar_point.trim().length).toBeGreaterThan(0);
          expect(point.sentence.trim().length).toBeGreaterThan(0);
          expect(point.explanation.trim().length).toBeGreaterThan(0);
        });
      },
      { timeout: 45000 }
    );
  });
};
