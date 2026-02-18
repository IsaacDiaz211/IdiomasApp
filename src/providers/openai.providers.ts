import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { LLMProvider } from './llm.providers';
import {
    detectLanguagePrompt,
    glossFromAlphabeticMorphemesPrompt,
    glossFromChineseMorphemesPrompt,
    grammarPointPrompt,
    interlinearAlphabeticPrompt,
    interlinearChinesePrompt,
    naturalTranslationPrompt,
    separateAlphabeticMorphemesPrompt,
    separateChineseMorphemesPrompt
} from './prompts';
import { GlossedSchema } from "../schemas/response";
import type { GlossedSentence } from "../schemas/response";
import type { GlossedChinese, GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseSchema } from "../schemas/chineseResponse";
import { GrammarArray, GrammarArraySchema } from "../schemas/grammar";
import {
    GlossFromMorphemesSchema,
    MorphemeExtractionAlphabeticSchema,
    MorphemeExtractionChineseSchema
} from "../schemas/intermediate";
import type { MorphemeData } from "../schemas/intermediate";

function getSentences(text: string, lang: string): string[] {
    const segmenter = new Intl.Segmenter(lang, { granularity: "sentence" });
    const segments = segmenter.segment(text);
    const sentences = Array.from(segments)
        .map((segment) => segment.segment.trim())
        .filter((segment) => segment.length > 0);

    if (sentences.length > 0) {
        return sentences;
    }

    const fallback = text.trim();
    return fallback ? [fallback] : [];
}

export class OpenAIProvider implements LLMProvider {
    
    constructor(public openai: OpenAI, public model?: string) {
        if (!model) {
            this.model = process.env.AI_MODEL || "qwen3-max-2026-01-23";
        }
    }

    async detectLanguage(text: string): Promise<string> {
        const cat = new OpenAI(
                            {
                                apiKey: process.env.LONGCAT_KEY,
                                baseURL: process.env.LONGCAT_BASE_URL,
                            }
                        );
        let prompt = detectLanguagePrompt(text);
        const completion = await cat.chat.completions.create({
            model: process.env.LONGCAT_MODEL || "LongCat-Flash-Thinking-2601",
            messages: [
                { role: "system", content: "You are a helpful translator and language expert." },
                { role: "user", content: prompt }
            ],
        });
        let response = completion.choices[0].message.content;
        if (!response) {
            throw new Error("From detectLanguage: No response from LLM.");
        } else {
            response = response.toLowerCase().trim();
        }
        return response || "";
    }

    async separateMorphemes(text: string, sourceLang: string): Promise<MorphemeData> {
        const normalizedSourceLang = sourceLang.trim().toLowerCase();
        const sentences = getSentences(text, normalizedSourceLang);

        if (sentences.length === 0) {
            throw new Error("From separateMorphemes: No sentences found in input text.");
        }

        if (normalizedSourceLang === "zh") {
            const separatedSentences = await Promise.all(
                sentences.map(async (sentence) => {
                    const prompt = separateChineseMorphemesPrompt(sentence);
                    const completion = await this.openai.chat.completions.parse({
                        model: this.model || "qwen3-max",
                        messages: [
                            { role: "system", content: "You are a helpful translator and language expert and teacher." },
                            { role: "user", content: prompt }
                        ],
                        response_format: zodResponseFormat(MorphemeExtractionChineseSchema, "separateChineseMorphemes")
                    });

                    const parsed = completion.choices[0].message.parsed;
                    if (!parsed) {
                        throw new Error("From separateMorphemes(zh): Failed to parse separated morphemes.");
                    }

                    const separateWords = parsed.morphemes.map((morpheme) => morpheme.hanzi.trim());
                    const pinyin = parsed.morphemes.map((morpheme) => morpheme.pinyin.trim());

                    if (separateWords.some((word) => word.length === 0) || pinyin.some((syllable) => syllable.length === 0)) {
                        throw new Error("From separateMorphemes(zh): Empty morpheme or pinyin received.");
                    }

                    return {
                        originalSentence: sentence,
                        separateWords,
                        pinyin
                    };
                })
            );

            return {
                type: "chinese",
                sourceLang: normalizedSourceLang,
                sentences: separatedSentences
            };
        }

        const separatedSentences = await Promise.all(
            sentences.map(async (sentence) => {
                const prompt = separateAlphabeticMorphemesPrompt(normalizedSourceLang, sentence);
                const completion = await this.openai.chat.completions.parse({
                    model: this.model || "qwen3-max",
                    messages: [
                        { role: "system", content: "You are a helpful translator and language expert and teacher." },
                        { role: "user", content: prompt }
                    ],
                    response_format: zodResponseFormat(MorphemeExtractionAlphabeticSchema, "separateAlphabeticMorphemes")
                });

                const parsed = completion.choices[0].message.parsed;
                if (!parsed) {
                    throw new Error("From separateMorphemes(alphabetic): Failed to parse separated morphemes.");
                }

                const separateWords = parsed.morphemes.map((morpheme) => morpheme.morpheme.trim());
                if (separateWords.some((word) => word.length === 0)) {
                    throw new Error("From separateMorphemes(alphabetic): Empty morpheme received.");
                }

                return {
                    originalSentence: sentence,
                    separateWords
                };
            })
        );

        return {
            type: "alphabetic",
            sourceLang: normalizedSourceLang,
            sentences: separatedSentences
        };
    }

    async glossFromMorphemes(
        morphemeData: MorphemeData,
        targetLang: string
    ): Promise<GlossedSentence[] | GlossedChineseSentence[]> {
        const normalizedTargetLang = targetLang.trim().toLowerCase();

        if (morphemeData.type === "chinese") {
            const glossedSentences = await Promise.all(
                morphemeData.sentences.map(async (sentenceData) => {
                    const prompt = glossFromChineseMorphemesPrompt(
                        normalizedTargetLang,
                        sentenceData.originalSentence,
                        sentenceData.separateWords,
                        sentenceData.pinyin
                    );

                    const completion = await this.openai.chat.completions.parse({
                        model: this.model || "qwen3-max",
                        messages: [
                            { role: "system", content: "You are a helpful translator and language expert and teacher." },
                            { role: "user", content: prompt }
                        ],
                        response_format: zodResponseFormat(GlossFromMorphemesSchema, "glossFromChineseMorphemes")
                    });

                    const parsed = completion.choices[0].message.parsed;
                    if (!parsed) {
                        throw new Error("From glossFromMorphemes(zh): Failed to parse gloss response.");
                    }

                    const glossedWords = parsed.glossedWords.map((word) => word.trim());
                    if (glossedWords.length !== sentenceData.separateWords.length) {
                        throw new Error("From glossFromMorphemes(zh): Gloss length does not match morpheme length.");
                    }

                    if (glossedWords.some((word) => word.length === 0)) {
                        throw new Error("From glossFromMorphemes(zh): Empty gloss received.");
                    }

                    return {
                        separateWords: sentenceData.separateWords,
                        pinyin: sentenceData.pinyin,
                        glossedWords
                    };
                })
            );

            return glossedSentences;
        }

        const glossedSentences = await Promise.all(
            morphemeData.sentences.map(async (sentenceData) => {
                const prompt = glossFromAlphabeticMorphemesPrompt(
                    normalizedTargetLang,
                    morphemeData.sourceLang,
                    sentenceData.originalSentence,
                    sentenceData.separateWords
                );

                const completion = await this.openai.chat.completions.parse({
                    model: this.model || "qwen3-max",
                    messages: [
                        { role: "system", content: "You are a helpful translator and language expert and teacher." },
                        { role: "user", content: prompt }
                    ],
                    response_format: zodResponseFormat(GlossFromMorphemesSchema, "glossFromAlphabeticMorphemes")
                });

                const parsed = completion.choices[0].message.parsed;
                if (!parsed) {
                    throw new Error("From glossFromMorphemes(alphabetic): Failed to parse gloss response.");
                }

                const glossedWords = parsed.glossedWords.map((word) => word.trim());
                if (glossedWords.length !== sentenceData.separateWords.length) {
                    throw new Error("From glossFromMorphemes(alphabetic): Gloss length does not match morpheme length.");
                }

                if (glossedWords.some((word) => word.length === 0)) {
                    throw new Error("From glossFromMorphemes(alphabetic): Empty gloss received.");
                }

                return {
                    originalText: sentenceData.separateWords,
                    glossedWords
                };
            })
        );

        return glossedSentences;
    }

    async translateText(text: string, l1: string, l2: string): Promise<string> {
        try {
            let translation: string | null;
            if(this.model === "qwen3-max-2026-01-23") {
                const completion = await this.openai.chat.completions.create({
                    model: "qwen-mt-plus", 
                    messages: [
                        { role: "user", content: text }
                    ],
                    translation_options: {
                        source_lang: l2,
                        target_lang: l1
                    }
                } as any);
                translation = completion.choices[0].message.content;
            } else {
                const prompt = naturalTranslationPrompt(l1, l2, text);
                const completion = await this.openai.chat.completions.create({
                    model: this.model || "qwen3-max",
                    messages: [
                        { role: "system", content: "You are a helpful translator and language expert." },
                        { role: "user", content: prompt },
                    ],
                });
                translation = completion.choices[0].message.content;
            }
            if (!translation) {
                throw new Error("From traslateText(null): Failed to parse translated text.");
            }
            return translation;
        } catch (error) {
            console.error("From translateText: Error translating text:", error);
            throw error;
        }
        
    }

    async glossText(text: string, l1: string, l2: string): Promise<GlossedSentence> {
        try {
            const prompt = interlinearAlphabeticPrompt(l1, l2, text);
            const completion = await this.openai.chat.completions.parse({
                model: this.model || "qwen3-max",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(GlossedSchema, "glossedText"),
            });
            //console.log("Glossing completion:", completion.choices[0].message);
            const glossedTranslation = completion.choices[0].message.parsed;

            if (!glossedTranslation) {
                throw new Error("Failed to parse glossed translation.");
            }

            if (!glossedTranslation) {
                //console.log("Failed to parse glossed translation")
                throw new Error("Failed to parse glossed translation.");
            }
            const result: GlossedSentence = {
                originalText: glossedTranslation.morphemes.map(s => s.morpheme.trim()),
                glossedWords: glossedTranslation.morphemes.map(s => s.gloss.trim())
            };
            return result;
        } catch (error) {
            console.error("Error glossing text:", error);
            throw error;
        }
    }

    async glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence> {
        try {
            const prompt = interlinearChinesePrompt(l1, text);
            const completion = await this.openai.chat.completions.parse({
                model: this.model || "qwen3-max",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert and teacher." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(GlossedChineseSchema, "glossedText"),
                //enable_thinking: true,
            });
            //console.log("Glossing completion:", completion.choices[0].message);
            const glossedTranslation: GlossedChinese | null = completion.choices[0].message.parsed;

            if (!glossedTranslation) {
                console.log("Failed to parse glossed translation")
                throw new Error("Failed to parse glossed translation.");
            }
            const result: GlossedChineseSentence = {
                separateWords: glossedTranslation.morphemes.map(s => s.hanzi.trim()),
                pinyin: glossedTranslation.morphemes.map(s => s.pinyin.trim()),
                glossedWords: glossedTranslation.morphemes.map(s => s.gloss.trim())
            };
            return result;
        } catch (error) {
            console.error("Error glossing text:", error);
            throw error;
        }
    }

    async getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray> {
        try {
            const prompt = grammarPointPrompt(l1, l2, text);
            const completion = await this.openai.chat.completions.parse({
                model: this.model || "qwen3-max",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert and teacher." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(GrammarArraySchema, "grammarPoints"),
            });
            const grammarPoints = completion.choices[0].message.parsed;

            if (!grammarPoints) {
                throw new Error("Failed to parse grammar points.");
            }
            //console.log("Grammar: ", completion.choices[0].message.parsed)
            return grammarPoints;
        } catch (error) {
            console.error("Error getting grammar points:", error);
            throw error;
        }
    }
}
