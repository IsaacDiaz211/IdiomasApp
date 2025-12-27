// A implementention using Qwen LLM model
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt } from './prompts';
import { GlossedSentence } from "../schemas/response";
import { GlossedTextZodSchema } from "../schemas/response";

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

    async translateText(text: string, l1: string, l2: string): Promise<string> {
        const prompt = `Translate the following text:\n${text} from ${l2} to ${l1}.`;
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
}