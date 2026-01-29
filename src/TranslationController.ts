import { Elysia } from 'elysia';
import { TextRequestSchema } from './schemas/request';
import { TextResponseSchema } from './schemas/response';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';

const TranslationController = new Elysia()
    .post(
        '/translate/:grammar?',
        async ({ body, params: { grammar } }) => {
            if((body.l2 === 'ko' && body.l1 !== 'en') || (body.l2 !== 'en' && body.l1 === 'ko')) {
                throw new Error("Korean (ko) translations are only supported with English (en) as the other language.");
            }
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
