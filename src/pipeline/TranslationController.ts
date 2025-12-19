import { Elysia, t } from 'elysia';
import { TextRequest, TextRequestSchema } from '../schemas/request';
import { TextResponse, TextResponseSchema } from '../schemas/response';
import { parseOrThrow } from '../schemas/validation';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body, set }) => {
            try {
                const parsedBody: TextRequest = parseOrThrow(TextRequestSchema, body);
                const translationResult = await fakeTranslate(parsedBody);
                set.status = 200;
                return parseOrThrow(TextResponseSchema, translationResult);
            } catch (error) {
                set.status = 400;
                return { error: (error as Error).message };
            }
        },
    );

export { TranslationController };

//todo : replace with elysia parser

async function fakeTranslate(request: TextRequest): Promise<TextResponse> {
    // Simulate translation delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
        request_id: crypto.randomUUID(),
        translatedText: `Translated (${request.l1} -> ${request.l2}): ${request.text}`,
        glossedText: `Glossed version of: ${request.text}`
     };
}