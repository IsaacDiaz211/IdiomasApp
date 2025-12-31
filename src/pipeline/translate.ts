import { TextToTranslateRequest } from '../schemas/request';
import { TextResponse, GlossedSentence } from '../schemas/response';
import { QwenProvider } from '../providers/qwen.providers';
import { randomUUIDv7 } from "bun";
import { ChineseResponse, GlossedChineseSentence } from '../schemas/chineseResponse';

async function runTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse | ChineseResponse> {
    try {
        if(input.l2.toLowerCase() === 'zh') {
            return await ChineseTranslationPipeline(input);
        } else {
            return await GeneralTranslationPipeline(input);
        }
    } catch (error) {
        console.error("Error from runTranslationPipeline:", error);
        throw error;  
    }
}

export { runTranslationPipeline };

function getSentences(text: string, lang: string): string[] {
    const segmenter = new Intl.Segmenter(lang, { granularity: 'sentence' });
    const segments = segmenter.segment(text);
    return Array.from(segments).map(s => s.segment.trim());
}

async function ChineseTranslationPipeline(input: TextToTranslateRequest): Promise<ChineseResponse> {
    try {
        const provider = new QwenProvider();
        const sentences = getSentences(input.text, input.l2);
        let glossedText = new Array<GlossedChineseSentence>();

        let languageDetected = await provider.detectLanguage(sentences[0]);
        console.log("Detected language:", languageDetected);

        if (languageDetected.toLowerCase() !== 'zh') {
            throw new Error("From verifyL2: Input text does not match the specified target language (l2).")
        }

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
        const provider = new QwenProvider();
        const sentences = getSentences(input.text, input.l2);
        let glossedText = new Array<GlossedSentence>();
        let languageDetected = await provider.detectLanguage(sentences[0]);
        console.log("Detected language:", languageDetected);

        if (languageDetected.toLowerCase() !== input.l2.toLowerCase()) {
            throw new Error("From verifyL2: Input text does not match the specified target language (l2).")
        }
        
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
