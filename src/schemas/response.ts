import { z } from "zod";

export const TextResponseSchema = z.object({
  request_id: z.uuid(),
  translatedText: z.string(),
  glossedText: z.string(),
});

export type TextResponse = z.infer<typeof TextResponseSchema>;

// Elysia schema equivalent

import { t, Static } from 'elysia';

export const TextResponseElysiaSchema = t.Object({
  request_id: t.String({ format: 'uuid' }),
  translatedText: t.String(),
  glossedText: t.String(),
});

export type TextResponseElysia = Static<typeof TextResponseElysiaSchema>;