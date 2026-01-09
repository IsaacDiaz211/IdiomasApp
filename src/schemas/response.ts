import { z } from 'zod';
import { GrammarArraySchema } from './grammar';
import { GlossedChineseSentenceSchema } from './chineseResponse';

const MorphemeSchema = z.object({
  morpheme: z.string(),
  gloss: z.string()
});

const GlossedSchema = z.object({
  morphemes: z.array(MorphemeSchema)
});

export { GlossedSchema };

const GlossedTextSchema = z.object({
  originalText: z.array(z.string()),
  glossedWords: z.array(z.string())
}).superRefine((data, ctx) => {
  if (data.originalText.length !== data.glossedWords.length) {
    ctx.addIssue({ code: "custom", path: ["length"], message: "separateWords and glossedWords must have the same length" });
  }
});

export { GlossedTextSchema };
export type GlossedSentence = z.infer<typeof GlossedTextSchema>

const SentencesTranslatedSchema = z.object({
  sentences: z.array(z.string())
});

export { SentencesTranslatedSchema };

export const TextResponseSchema = z.object({
  request_id: z.uuidv7(),
  translatedText: z.array(z.string()),
  glossedText: z.array(GlossedChineseSentenceSchema).or(z.array(GlossedTextSchema)),
  grammarPoints: z.optional(GrammarArraySchema)
});

export type TextResponse = z.infer<typeof TextResponseSchema>;