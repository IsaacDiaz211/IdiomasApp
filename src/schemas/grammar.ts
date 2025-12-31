import { t, Static } from 'elysia';
import { z } from 'zod';

const GrammarPointZodSchema = z.object({
  grammar_point: z.string(),
  sentence: z.string(),
  explanation: z.string()
});

const GrammarArrayZodSchema = z.object({
    points: z.array(GrammarPointZodSchema)
})

export { GrammarArrayZodSchema }

const GrammarPointSchema = t.Object({
    grammar_point: t.String(),
    sentence: t.String(),
    explanation: t.String()
});

const GrammarArraySchema = t.Object({
    points: t.Array(GrammarPointSchema)
})

export { GrammarArraySchema }
export type GrammarPoint = Static<typeof GrammarPointSchema>;
export type GrammarArray = Static<typeof GrammarArraySchema>;