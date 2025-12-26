import { TextToTranslateRequest } from '../schemas/request';
import { TextResponse } from '../schemas/response';
import { QwenProvider } from '../providers/qwen.providers';
import { randomUUIDv7 } from "bun";
import type { HttpError } from '../logs/errors';

async function runTranslationPipeline(input: TextToTranslateRequest): Promise<TextResponse> {
    // This function would orchestrate the translation pipeline
    try {
        if (!verifyL2(input.text, input.l2)) {
            const issues = [{ message: 'Input text does not match the specified target language (l2).' }];
            const errorL2: HttpError = {
                status: 422,
                body: new Error("ValidationError"),
                issues: issues,
            };
            return Promise.reject(errorL2);
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
        const message = error instanceof Error ? error.message : String(error);
        const errorService: HttpError = {
                status: 503,
                body: new Error(message),
                issues: 'Error during translation or glossing process',
            };
        return Promise.reject(errorService);   
    }
    
}

export { runTranslationPipeline };

function verifyL2(text: string, l2: string): boolean {
    // To implement a simple check to verify if the text is in the target language (l2)
    return true; // Placeholder implementation
}
