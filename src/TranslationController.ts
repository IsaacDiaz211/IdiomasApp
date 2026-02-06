import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';

const TranslationController = new Elysia()
    .post(
        '/translate/:grammar?',
        async ({ body, params: { grammar } }) => {
            let translationResult;
            if (grammar){
                translationResult = await runTranslationPipeline(body, true, true);
            } else {
                translationResult = await runTranslationPipeline(body, true, false);
            }
            return translationResult;
        },
        {
            body: TextRequestSchema, 
        }
    )

export { TranslationController };
