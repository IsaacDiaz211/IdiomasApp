import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt, interlinearChinesePrompt, detectLanguagePrompt, grammarPointPrompt, naturalTranslationPrompt } from './prompts';
import { GlossedSchema, SentencesTranslatedSchema } from "../schemas/response";
import type { GlossedSentence } from "../schemas/response";
import type { GlossedChinese, GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseSchema } from "../schemas/chineseResponse";
import { GrammarArray, GrammarArraySchema } from "../schemas/grammar";
import { zodToJsonSchema } from "zod-to-json-schema";

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
