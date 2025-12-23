// A implementention using Qwen LLM model
import OpenAI from "openai";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt } from './prompts';
import { int } from "zod";

export class QwenProvider implements LLMProvider {
    openai = new OpenAI(
        {
            apiKey: process.env.AI_KEY,
            baseURL: process.env.AI_BASE_URL,
        }
    );

    async main(input: string): Promise<string> {
        const completion = await this.openai.chat.completions.create({
            model: "qwen-plus",
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

    async glossText(text: string, l1: string, l2: string): Promise<string> {
        const prompt = interlinearAlphabeticPrompt(l1, l2, text);
        return await this.main(prompt);
    }
}