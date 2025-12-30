import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { ChineseResponseSchema } from './schemas/chineseResponse';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body }) => {
            const translationResult = await runTranslationPipeline(body);
            //return translationResult;
            return parseOrThrow(TextResponseSchema, translationResult);
        },
        {
            body: TextRequestSchema, 
        }
    )
    .post(
        '/translate/chinese',
        async ({ body }) => {
            const translationResult = await runTranslationPipeline(body);
            return parseOrThrow(ChineseResponseSchema, translationResult);
        },
        {
            body: TextRequestSchema, 
        }
    )

export { TranslationController };
