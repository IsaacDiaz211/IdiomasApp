import { TextToTranslateRequest } from '../schemas/request';
import { TextResponse } from '../schemas/response';
import { QwenProvider } from '../providers/qwen.providers';
import { randomUUIDv7 } from "bun";

async function runTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse> {
    // This function would orchestrate the translation pipeline
    try {
        if (!verifyL2(input.text, input.l2)) {
            return Promise.reject(new Error('The text is not in the l2 language'));
        }
        const provider = new QwenProvider();
        const translatedText = await provider.translateText(input.text, input.l1, input.l2);
        const glossedText = await provider.glossText(input.text, input.l1, input.l2);

        return {
            request_id: randomUUIDv7(),
            translatedText,
            glossedText
        };
    } catch (error) {
        return Promise.reject(new Error('Translation pipeline failed'));
    }
    
}

export { runTranslationPipeline };

function verifyL2(text: string, l2: string): boolean {
    // To implement a simple check to verify if the text is in the target language (l2)
    return true; // Placeholder implementation
}
