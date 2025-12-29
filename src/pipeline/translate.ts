import { TextToTranslateRequest } from '../schemas/request';
import { TextResponse, GlossedSentence } from '../schemas/response';
import { QwenProvider } from '../providers/qwen.providers';
import { randomUUIDv7 } from "bun";
import { ChineseResponse, GlossedChineseSentence } from '../schemas/chineseResponse';

async function runTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse | ChineseResponse> {
    try {
        if (!verifyL2(input.text, input.l2)) {
            throw new Error("Input text does not match the specified target language (l2).")
        }
        if(input.l2.toLowerCase() === 'chinese') {
            return await ChineseTranslationPipeline(input);
        } else {
            return await GeneralTranslationPipeline(input);
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;  
    }
}

export { runTranslationPipeline };

function verifyL2(text: string, l2: string): boolean {
    // To implement a simple check to verify if the text is in the target language (l2)
    return true; // Placeholder implementation
}

function separeteSentences(text: string): string[] {
    // Simple sentence separation based on punctuation
    return text.split(/(?<=[.!?])\s+/);
}

function separeteChineseSentences(text: string): string[] {
    // Simple sentence separation based on Chinese punctuation
    return text.split(/(?<=[。！？])\s+/);
}

async function ChineseTranslationPipeline(input: TextToTranslateRequest): Promise<ChineseResponse> {
    try {
        if (!verifyL2(input.text, input.l2)) {
            throw new Error("Input text does not match the specified target language (l2).")
        }
        const sentences = separeteChineseSentences(input.text);
        let glossedText = new Array<GlossedChineseSentence>();
        const provider = new QwenProvider();
        const translatedText = await provider.translateText(input.text, input.l1, input.l2, sentences.length);

        for (const sentence of sentences) {
            const gloss = await provider.glossChineseText(sentence, input.l1);
            glossedText.push(gloss);
        }

        return {
            request_id: randomUUIDv7(),
            translatedText,
            glossedText
        };
    } catch (error) {
        console.error("Error:", error);
        throw error;  
    }
}

async function GeneralTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse> {
    try {
        if (!verifyL2(input.text, input.l2)) {
            throw new Error("Input text does not match the specified target language (l2).")
        }
        const sentences = separeteSentences(input.text);
        let glossedText = new Array<GlossedSentence>();
        const provider = new QwenProvider();
        const translatedText = await provider.translateText(input.text, input.l1, input.l2, sentences.length);

        for (const sentence of sentences) {
            const gloss = await provider.glossText(sentence, input.l1, input.l2);
            glossedText.push(gloss);
        }

        return {
            request_id: randomUUIDv7(),
            translatedText,
            glossedText
        };
    } catch (error) {
        console.error("Error:", error);
        throw error;  
    }
}
