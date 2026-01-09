import { z } from 'zod';

const MorphemeSchema = z.object({
  hanzi: z.string(),
  pinyin: z.string(),
  gloss: z.string()
});

const GlossedChineseSchema = z.object({
  morphemes: z.array(MorphemeSchema)
});

export { GlossedChineseSchema };

export type GlossedChinese = z.infer<typeof GlossedChineseSchema>;

const GlossedChineseSentenceSchema = z.object({
    separateWords: z.array(z.string()),
    pinyin: z.array(z.string()),
    glossedWords: z.array(z.string())
}).superRefine((data, ctx) => {
  if (data.separateWords.length !== data.pinyin.length || data.separateWords.length !== data.glossedWords.length) {
    ctx.addIssue({ code: "custom", path: ["length"], message: "separateWords, pinyin, and glossedWords must have the same length" });
  }
});

export { GlossedChineseSentenceSchema };
export type GlossedChineseSentence = z.infer<typeof GlossedChineseSentenceSchema>;