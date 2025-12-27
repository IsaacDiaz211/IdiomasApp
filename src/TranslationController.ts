import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';
import { toHttpError } from './logs/errors';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body }) => {
            try {
                const translationResult = await runTranslationPipeline(body);
                return parseOrThrow(TextResponseSchema, translationResult);
            } catch (error) {
                const httpError = toHttpError(error);
                return httpError.body;        
            }
        },
        {
            body: TextRequestSchema, 
        }
    );

export { TranslationController };
