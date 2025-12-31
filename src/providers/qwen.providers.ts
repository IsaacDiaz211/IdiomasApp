// A implementention using Qwen LLM model
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt, interlinearChinesePrompt, naturalTranslationPrompt, detectLanguagePrompt } from './prompts';
import { GlossedSentence } from "../schemas/response";
import { GlossedTextZodSchema, SentencesTranslatedZodSchema } from "../schemas/response";
import { GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseZodSchema } from "../schemas/chineseResponse";

export class QwenProvider implements LLMProvider {
    openai = new OpenAI(
        {
            apiKey: process.env.AI_KEY,
            baseURL: process.env.AI_BASE_URL,
        }
    );

    async detectLanguage(text: string): Promise<string> {
        let prompt = detectLanguagePrompt(text);
        const completion = await this.openai.chat.completions.create({
            model: "qwen-flash",
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

    async translateText(text: string, l1: string, l2: string, num_sentences: number): Promise<string[]> {
        try {
            const prompt = naturalTranslationPrompt(l1, l2, text, num_sentences);
            const completion = await this.openai.chat.completions.parse({
                model: "qwen-plus",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(SentencesTranslatedZodSchema, "sentences")
            });
            //console.log("Translation :", completion.choices[0].message);
            let translation = completion.choices[0].message.parsed;
            if (!translation) {
                throw new Error("From traslateText(null): Failed to parse translated text.");
            }
            if (translation.sentences.length !== num_sentences) {
                throw new Error("From translateText(!==): Parsed translated text has mismatched number of sentences.");
            }
            let response = translation.sentences; //.map(sentence => sentence.trim());
            return response;
        } catch (error) {
            console.error("From translateText: Error translating text:", error);
            throw error;
        }
        
    }

    async glossText(text: string, l1: string, l2: string): Promise<GlossedSentence> {
        try {
            const prompt = interlinearAlphabeticPrompt(l1, l2, text);
            const completion = await this.openai.chat.completions.parse({
                model: "qwen-plus",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(GlossedTextZodSchema, "glossedText"),
            });
            //console.log("Glossing completion:", completion.choices[0].message);
            const glossedTranslation: GlossedSentence | null = completion.choices[0].message.parsed;

            if (!glossedTranslation) {
                throw new Error("Failed to parse glossed translation.");
            }
            if(glossedTranslation.originalText.length !== glossedTranslation.glossedWords.length) {
                throw new Error("Parsed glossed translation has mismatched lengths.");
            }

            glossedTranslation.originalText.map(word => word.trim());
            glossedTranslation.glossedWords.map(word => word.trim());
            
            glossedTranslation.glossedWords
            return {
                originalText: glossedTranslation.originalText,
                glossedWords: glossedTranslation.glossedWords
            };
        } catch (error) {
            console.error("Error glossing text:", error);
            throw error;
        }
    }

    async glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence> {
        try {
            const prompt = interlinearChinesePrompt(l1, text);
            const completion = await this.openai.chat.completions.parse({
                model: "qwen-plus",
                messages: [
                    { role: "system", content: "You are a helpful translator and language expert and teacher." },
                    { role: "user", content: prompt },
                ],
                response_format: zodResponseFormat(GlossedChineseZodSchema, "glossedText"),
            });
            //console.log("Glossing completion:", completion.choices[0].message);
            const glossedTranslation: GlossedChineseSentence | null = completion.choices[0].message.parsed;

            if (!glossedTranslation) {
                throw new Error("Failed to parse glossed translation.");
            }
            if(glossedTranslation.separateWords.length !== glossedTranslation.glossedWords.length
                && glossedTranslation.separateWords.length !== glossedTranslation.pinyin.length
            ) {
                throw new Error("Parsed glossed translation has mismatched lengths.");
            }

            glossedTranslation.separateWords.map(word => word.trim());
            glossedTranslation.pinyin.map(word => word.trim());
            glossedTranslation.glossedWords.map(word => word.trim());

            return {
                separateWords: glossedTranslation.separateWords,
                pinyin: glossedTranslation.pinyin,
                glossedWords: glossedTranslation.glossedWords
            };
        } catch (error) {
            console.error("Error glossing text:", error);
            throw error;
        }
    }
}