import { Mistral } from '@mistralai/mistralai';
import { zodResponseFormat } from "openai/helpers/zod";
import { LLMProvider } from './llm.providers';
import { interlinearAlphabeticPrompt, interlinearChinesePrompt, detectLanguagePrompt, grammarPointPrompt, naturalTranslationPrompt } from './prompts';
import { GlossedSchema, SentencesTranslatedSchema } from "../schemas/response";
import type { GlossedSentence } from "../schemas/response";
import type { GlossedChinese, GlossedChineseSentence } from "../schemas/chineseResponse";
import { GlossedChineseSchema } from "../schemas/chineseResponse";
import { GrammarArray, GrammarArraySchema } from "../schemas/grammar";

export class MistralProvider implements LLMProvider {

    client = new Mistral({apiKey: process.env.MISTRAL_API_KEY});

    async detectLanguage(text: string): Promise<string> {
        let prompt = detectLanguagePrompt(text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-tiny-latest',
            messages: [{role: 'user', content: prompt}]
        });
        const content = chatResponse.choices[0].message.content;
        if (!content || typeof content !== 'string') {
            throw new Error("From detectLanguage: No response from LLM.");
        }
        const response = content.toLowerCase().trim();
        return response;
    }

    async translateText(text: string, l1: string, l2: string): Promise<string> {
        const prompt = naturalTranslationPrompt(l1, l2, text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}],
        });
        const translation = chatResponse.choices[0].message.content;
        if (!translation || typeof translation !== 'string') {
            throw new Error("From traslateText(null): Failed to parse translated text.");
        }
        return translation;
    }

    async glossText(text: string, l1: string, l2: string): Promise<GlossedSentence> {
        const prompt = interlinearAlphabeticPrompt(l1, l2, text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}],
            responseFormat: zodResponseFormat(GlossedSchema, "glossedText"),
        });
        const content = chatResponse.choices[0].message.content;
        if (!content || typeof content !== 'string') {
            throw new Error("Failed to parse glossed translation.");
        }

        const glossedTranslation = JSON.parse(content);
        const result: GlossedSentence = {
            originalText: glossedTranslation.morphemes.map((s: any) => s.morpheme.trim()),
            glossedWords: glossedTranslation.morphemes.map((s: any) => s.gloss.trim())
        };
        return result;
    }

    async glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence> {
        const prompt = interlinearChinesePrompt(l1, text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}],
            responseFormat: zodResponseFormat(GlossedChineseSchema, "glossedText"),
        });
        const content = chatResponse.choices[0].message.content;
        if (!content || typeof content !== 'string') {
            throw new Error("Failed to parse glossed translation.");
        }

        const glossedTranslation = JSON.parse(content);
        const result: GlossedChineseSentence = {
            separateWords: glossedTranslation.morphemes.map((s: any) => s.hanzi.trim()),
            pinyin: glossedTranslation.morphemes.map((s: any) => s.pinyin.trim()),
            glossedWords: glossedTranslation.morphemes.map((s: any) => s.gloss.trim())
        };
        return result;
    }

    async getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray> {
        const prompt = grammarPointPrompt(l1, l2, text);
        const chatResponse = await this.client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}],
            responseFormat: zodResponseFormat(GrammarArraySchema, "grammarPoints"),
        });
        const grammarPoints = chatResponse.choices[0].message.content;

        if (!grammarPoints || typeof grammarPoints !== 'string') {
            throw new Error("Failed to parse grammar points.");
        }
        let response = JSON.parse(grammarPoints);

        return response as GrammarArray;
    }
}