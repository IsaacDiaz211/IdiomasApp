import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';
import { toHttpError } from './logs/errors';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body, set }) => {
            try {
                const translationResult = await runTranslationPipeline(body);
                set.status = 200;
                return parseOrThrow(TextResponseSchema, translationResult);
            } catch (error: unknown) {
                const httpError = toHttpError(error);
                set.status = httpError.status;
                return httpError.body;        
            }
        },
        {
            body: TextRequestSchema, 
        }
    );

export { TranslationController };
