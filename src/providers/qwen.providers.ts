// A implementention using Qwen LLM model
import OpenAI from "openai";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt } from './prompts';
import { GlossedText } from "../schemas/response";

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

    async glossText(text: string, l1: string, l2: string): Promise<GlossedText> {
        const prompt = interlinearAlphabeticPrompt(l1, l2, text);
        const response = await this.main(prompt);
        let originalText: string[] = [];
        let glossedWords: string[] = [];

        // Simple parsing logic assuming the response format is consistent
        const lines = response.split('.');
        originalText = lines[0].split('/').map(word => word.trim());
        glossedWords = lines[1].split('/').map(word => word.trim());

        return {
            originalText,
            glossedWords
        };
    }
}