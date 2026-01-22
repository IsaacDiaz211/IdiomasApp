import { TextToTranslateRequest } from '../schemas/request';
import type { TextResponse } from '../schemas/response';
import { OpenAIProvider } from '../providers/openai.providers';
import { randomUUIDv7 } from "bun";

function getSentences(text: string, lang: string): string[] {
    const segmenter = new Intl.Segmenter(lang, { granularity: 'sentence' });
    const segments = segmenter.segment(text);
    return Array.from(segments).map(s => s.segment.trim());
}

async function runTranslationPipeline(input: TextToTranslateRequest, grammar?: boolean): Promise<TextResponse> {
    try {
        const provider = new OpenAIProvider();
        const sentences = getSentences(input.text, input.l2);
        let languageDetected = await provider.detectLanguage(sentences[0]);
        console.log("Detected language:", languageDetected);

        if (languageDetected.toLowerCase() !== input.l2) {
            throw new Error("From verifyL2: Input text does not match the specified target language (l2).")
        }
        const translatedText = await Promise.all(
            sentences.map((sentence) => provider.translateText(sentence, input.l1, input.l2))
        );

        let glossedText;
        let grammarPoints;
        if (input.l2 === 'zh'){
            glossedText = await Promise.all(
                sentences.map((sentence) => provider.glossChineseText(sentence, input.l1))
            );
            if (grammar) {
                grammarPoints = await provider.getGrammarPoints(input.text, input.l1, input.l2);
                return {
                    request_id: randomUUIDv7(),
                    translatedText,
                    glossedText,
                    grammarPoints
                };
            } else {
                return {
                    request_id: randomUUIDv7(),
                    translatedText,
                    glossedText
                };
            }
        } else {
            glossedText = await Promise.all(
                sentences.map((sentence) => provider.glossText(sentence, input.l1, input.l2))
            );
            if (grammar) {
                grammarPoints = await provider.getGrammarPoints(input.text, input.l1, input.l2);
                return {
                    request_id: randomUUIDv7(),
                    translatedText,
                    glossedText,
                    grammarPoints
                };
            } else {
                return {
                    request_id: randomUUIDv7(),
                    translatedText,
                    glossedText
                };
            }
            
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;  
    }
}

export { runTranslationPipeline };