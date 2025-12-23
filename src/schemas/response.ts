import { t, Static } from 'elysia';

const GlossedTextSchema = t.Transform(
  t.Object({
    originalText: t.Array(t.String()),
    glossedWords: t.Array(t.String())
  })
).Decode(data => {
    if (data.originalText.length !== data.glossedWords.length) {
        throw new Error("originalText and glossedWords must have the same length");
    }
    return data;
}).Encode(data => data);

export type GlossedText = Static<typeof GlossedTextSchema>;

export const TextResponseSchema = t.Object({
  request_id: t.String({ format: 'uuid' }),
  translatedText: t.String(),
  glossedText: GlossedTextSchema,
});

export type TextResponse = Static<typeof TextResponseSchema>;