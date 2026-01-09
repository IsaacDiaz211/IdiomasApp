import { z } from 'zod';

const GrammarPointSchema = z.object({
  grammar_point: z.string(),
  sentence: z.string(),
  explanation: z.string()
});

const GrammarArraySchema = z.object({
    points: z.array(GrammarPointSchema)
})

export { GrammarArraySchema }

export type GrammarPoint = z.infer<typeof GrammarPointSchema>;
export type GrammarArray = z.infer<typeof GrammarArraySchema>;