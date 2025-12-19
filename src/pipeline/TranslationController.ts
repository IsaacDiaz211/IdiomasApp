import { Elysia } from 'elysia';
import { TextToTranslateRequest, TextRequestElysiaSchema } from '../schemas/request';
import { TextResponse, TextResponseSchema } from '../schemas/response';
import { parseOrThrow } from '../schemas/validation';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body, set }) => {
            try {
                const translationResult = await fakeTranslate(body);
                set.status = 200;
                return parseOrThrow(TextResponseSchema, translationResult);
            } catch (error) {
                set.status = 400;
                return { error: (error as Error).message };
            }
        },
        {
            body: TextRequestElysiaSchema, 
        }
    );

export { TranslationController };

async function fakeTranslate(request: TextToTranslateRequest): Promise<TextResponse> {
    // Simulate translation delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
        request_id: crypto.randomUUID(),
        translatedText: `Translated (${request.l1} -> ${request.l2}): ${request.text}`,
        glossedText: `Glossed version of: ${request.text}`
     };
};