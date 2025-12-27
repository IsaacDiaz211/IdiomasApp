import { TextToTranslateRequest } from '../schemas/request';
import { TextResponse, GlossedSentence } from '../schemas/response';
import { QwenProvider } from '../providers/qwen.providers';
import { randomUUIDv7 } from "bun";

async function runTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse> {
    // This function would orchestrate the translation pipeline
    try {
        if (!verifyL2(input.text, input.l2)) {
            throw new Error("Input text does not match the specified target language (l2).")
        }
        const sentences = separeteSentences(input.text);
        let glossedText = new Array<GlossedSentence>();
        const provider = new QwenProvider();
        const translatedText = await provider.translateText(input.text, input.l1, input.l2);

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

export { runTranslationPipeline };

function verifyL2(text: string, l2: string): boolean {
    // To implement a simple check to verify if the text is in the target language (l2)
    return true; // Placeholder implementation
}

function separeteSentences(text: string): string[] {
    // Simple sentence separation based on punctuation
    return text.split(/(?<=[.!?])\s+/);
}
