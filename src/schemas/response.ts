import { t, Static } from 'elysia';

export const TextResponseSchema = t.Object({
  request_id: t.String({ format: 'uuid' }),
  translatedText: t.String(),
  glossedText: t.String(),
});

export type TextResponse = Static<typeof TextResponseSchema>;