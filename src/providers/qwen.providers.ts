// A implementention using Qwen LLM model
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt, interlinearChinesePrompt } from './prompts';
import { GlossedSentence } from "../schemas/response";
import { GlossedTextZodSchema } from "../schemas/response";
import { GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseZodSchema } from "../schemas/chineseResponse";

export class QwenProvider implements LLMProvider {
    openai = new OpenAI(
        {
            apiKey: process.env.AI_KEY,
            baseURL: process.env.AI_BASE_URL,
        }
    );

    async main(input: string): Promise<string> {
        const completion = await this.openai.chat.completions.create({
            model: process.env.AI_MODEL || "qwen-plus",
            messages: [
                { role: "system", content: "You are a helpful translator and language expert." },
                { role: "user", content: input }
            ],
        });
        return completion.choices[0].message.content || "";
    }

    async translateText(text: string, l1: string, l2: string, num_sentences: number): Promise<string> {
        const prompt = `Translate the following text from ${l2} to ${l1} but maintain the order of the sentences
        of the original text, the amount of sentences in the original must be equeal to the tranlated text result.
        In this case, the text has ${num_sentences} sentences.
        The text to translate is:\n${text} .`;
        return await this.main(prompt);
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
            console.log("Glossing completion:", completion.choices[0].message);
            const glossedTranslation: GlossedSentence | null = completion.choices[0].message.parsed;

            /*let originalText: string[] = [];
            let glossedWords: string[] = [];
            console.log("Glossing response:", response);
            // Simple parsing logic assuming the response format is consistent
            const lines = response.split('#').map(line => line.trim());
            originalText = lines[0].split('/').map(word => word.trim());
            glossedWords = lines[1].split('/').map(word => word.trim());*/

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
            console.log("Glossing completion:", completion.choices[0].message);
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