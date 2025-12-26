export type HttpError = {
    status: number;
    body: Error;
    issues?: unknown;
};

export function isHttpError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error && 'body' in error) {
        return true;
    }
    return false;
}

export function toHttpError(error: unknown): HttpError {
    if (isHttpError(error) && typeof error === 'object' && error !== null) {
        return {
            status: (error as any).status,
            body: (error as any).body,
            issues: (error as any).issues
        };
    } else {
        if (error instanceof Error) {
            switch (error.message) {
                case 'ValidationError':
                    return {
                        status: 422,
                        body: error
                    };

                case 'ProcessingError':
                    return {
                        status: 500,
                        body: error
                    };
                default:
                    return {
                        status: 500,
                        body: new Error(error.message)
                    };
            }
        } else {
            return {
                status: 500,
                body: new Error('InternalServerError')
            };      
        }
    }
};