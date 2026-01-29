import { Mistral } from '@mistralai/mistralai';
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ResponseFormat } from "@mistralai/mistralai/models/components/responseformat";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPromptMistral, interlinearChinesePromptMistral, detectLanguagePrompt, grammarPointPrompt, naturalTranslationPrompt } from './prompts';
import { GlossedSchema } from "../schemas/response";
import type { GlossedSentence } from "../schemas/response";
import type { GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseSchema } from "../schemas/chineseResponse";
import { GrammarArray, GrammarArraySchema } from "../schemas/grammar";
import { OpenAI } from 'openai';

export interface Morpheme {
  morpheme: string;
  gloss: string;
  hanzi?: string;
  pinyin?: string;
}

export interface GlossedTranslation {
  morphemes: Morpheme[];
}

export interface GrammarPoint {
  term: string;
  explanation: string;
  example: string;
}

export type GrammarArrayType = GrammarPoint[];

const buildResponseFormat = (schema: unknown, name: string): ResponseFormat => ({
    type: "json_schema",
    jsonSchema: {
        name,
        schemaDefinition: zodToJsonSchema(schema as any),
        strict: true
    }
});

export class MistralProvider implements LLMProvider {

    constructor(public client: Mistral) {}

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
        const prompt = naturalTranslationPrompt(l1, l2, text);
        try {
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
        });

        const translation = chatResponse.choices[0]?.message?.content;
        if (!translation || typeof translation !== 'string') {
            throw new Error('Invalid translation response format.');
        }

        return translation.trim();
        } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred during translation.';
        throw new Error(`Translation failed for text "${text}": ${errorMessage}`);
        }
    }

    async glossText(text: string, l1: string, l2: string): Promise<GlossedSentence> {
        const prompt = interlinearAlphabeticPromptMistral(l1, l2, text);
        try {
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: buildResponseFormat(GlossedSchema, 'glossedText'),
        });

        const content = chatResponse.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid gloss response format.');
        }

        const glossedTranslation = GlossedSchema.parse(JSON.parse(content));
        return {
            originalText: glossedTranslation.morphemes.map((m: Morpheme) => m.morpheme.trim()),
            glossedWords: glossedTranslation.morphemes.map((m: Morpheme) => m.gloss.trim()),
        };
        } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred while glossing text.';
        throw new Error(`Glossing failed for text "${text}": ${errorMessage}`);
        }
    }

    async glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence> {
        const prompt = interlinearChinesePromptMistral(l1, text);
        try {
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: buildResponseFormat(GlossedChineseSchema, 'glossedText'),
        });

        const content = chatResponse.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid gloss response format for Chinese text.');
        }

        const glossedTranslation = GlossedChineseSchema.parse(JSON.parse(content));
        return {
            separateWords: glossedTranslation.morphemes.map((m: { hanzi?: string; pinyin?: string; gloss: string }) => m.hanzi?.trim() || ''),
            pinyin: glossedTranslation.morphemes.map((m: { hanzi?: string; pinyin?: string; gloss: string }) => m.pinyin?.trim() || ''),
            glossedWords: glossedTranslation.morphemes.map((m: { hanzi?: string; pinyin?: string; gloss: string }) => m.gloss.trim()),
        };
        } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred while glossing Chinese text.';
        throw new Error(`Chinese glossing failed for text "${text}": ${errorMessage}`);
        }
    }

    async getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray> {
        const prompt = grammarPointPrompt(l1, l2, text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}],
            responseFormat: buildResponseFormat(GrammarArraySchema, "grammarPoints"),
        });
        const grammarPoints = chatResponse.choices[0].message.content;

        if (!grammarPoints || typeof grammarPoints !== 'string') {
            throw new Error("Failed to parse grammar points.");
        }
        let response = JSON.parse(grammarPoints);

        return response as GrammarArray;
    }
}
