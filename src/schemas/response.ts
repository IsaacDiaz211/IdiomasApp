import { t, Static } from 'elysia';
import { z } from 'zod';

const GlossedTextZodSchema = z.object({
  originalText: z.array(z.string()),
  glossedWords: z.array(z.string())
});

export { GlossedTextZodSchema };

const GlossedSentenceSchema = t.Transform(
  t.Object({
    originalText: t.Array(t.String()),
    glossedWords: t.Array(t.String())
  })
)
.Decode(data => {
    if (data.originalText.length !== data.glossedWords.length) {
        throw new Error("originalText and glossedWords must have the same length");
    }
    return data;
}).Encode(data => data);

export type GlossedSentence = Static<typeof GlossedSentenceSchema>;

const SentencesTranslatedZodSchema = z.object({
  sentences: z.array(z.string())
});

export { SentencesTranslatedZodSchema };

export const TextResponseSchema = t.Object({
  request_id: t.String(),
  translatedText: t.Array(t.String()),
  glossedText: t.Array(GlossedSentenceSchema),
});

export type TextResponse = Static<typeof TextResponseSchema>;