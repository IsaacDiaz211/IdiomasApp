import { Elysia } from 'elysia';
import { TextToTranslateRequest, TextRequestSchema } from './schemas/request';
import { TextResponse, TextResponseSchema } from './schemas/response';
import { parseOrThrow } from './schemas/validation';
import { runTranslationPipeline } from './pipeline/translate';

const TranslationController = new Elysia()
    .post(
        '/translate', 
        async ({ body, set }) => {
            try {
                const translationResult = await runTranslationPipeline(body);
                set.status = 200;
                return parseOrThrow(TextResponseSchema, translationResult);
            } catch (error) {
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

type ErrorBody = {
    error: string;
    details?: unknown;
};

type HttpError = {
    status: number;
    body: ErrorBody;
};

function isValidationError(error: unknown): error is Error & { issues: unknown } {
    return (
        error instanceof Error &&
        error.message === 'ValidationError' &&
        'issues' in error
    );
}

function toHttpError(error: unknown): HttpError {
    if (isValidationError(error)) {
        return {
            status: 422,
            body: {
                error: 'ValidationError',
                details: error.issues,
            },
        };
    }

    return {
        status: 500,
        body: {
            error: 'InternalServerError',
        },
    };
}
