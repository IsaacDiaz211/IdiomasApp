import { t, Static } from 'elysia';
import { z } from 'zod';
import { GrammarArraySchema } from './grammar';

const GlossedChineseZodSchema = z.object({
  separateWords: z.array(z.string()),
  pinyin: z.array(z.string()),
  glossedWords: z.array(z.string())
});

export { GlossedChineseZodSchema };

const GlossedChineseSentenceSchema = t.Transform(
  t.Object({
    separateWords: t.Array(t.String()),
    pinyin: t.Array(t.String()),
    glossedWords: t.Array(t.String())
  })
)
.Decode(data => {
    if (data.separateWords.length !== data.glossedWords.length || data.separateWords.length !== data.pinyin.length) {
        throw new Error("separateWords, pinyin, and glossedWords must have the same length");
    }
    return data;
}).Encode(data => data);

export type GlossedChineseSentence = Static<typeof GlossedChineseSentenceSchema>;
 
export const ChineseResponseSchema = t.Object({
  request_id: t.String(),
  translatedText: t.Array(t.String()),
  glossedText: t.Array(GlossedChineseSentenceSchema),
  grammarPoints: t.Optional(GrammarArraySchema)
});

export type ChineseResponse = Static<typeof ChineseResponseSchema>;