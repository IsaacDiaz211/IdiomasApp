import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { ChineseResponseSchema } from './schemas/chineseResponse';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';

const TranslationController = new Elysia()
    .post(
        '/translate/:grammar?',
        async ({ body, params: { grammar } }) => {
            let translationResult;
            if (grammar){
                translationResult = await runTranslationPipeline(body, true);
            } else {
                translationResult = await runTranslationPipeline(body);
            }
            if(body.l2 === 'zh'){
                return parseOrThrow(ChineseResponseSchema, translationResult);
            }
            return parseOrThrow(TextResponseSchema, translationResult);
        },
        {
            body: TextRequestSchema, 
        }
    )
    .post(
        '/translate/grammar',
        async ({ body }) => {
            const translationResult = await runTranslationPipeline(body, true);
            return parseOrThrow(TextResponseSchema, translationResult);
        },
        {
            body: TextRequestSchema,
        }
    )

export { TranslationController };
