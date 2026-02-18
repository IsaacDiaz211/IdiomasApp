import { z } from "zod";

export const MorphemeExtractionAlphabeticSchema = z.object({
  morphemes: z.array(z.object({ morpheme: z.string().min(1) })).min(1)
});

export const MorphemeExtractionChineseSchema = z.object({
  morphemes: z.array(
    z.object({
      hanzi: z.string().min(1),
      pinyin: z.string().min(1)
    })
  ).min(1)
});

export const GlossFromMorphemesSchema = z.object({
  glossedWords: z.array(z.string().min(1)).min(1)
});

export const MorphemeSentenceAlphabeticSchema = z.object({
  originalSentence: z.string().min(1),
  separateWords: z.array(z.string().min(1)).min(1)
});

export const MorphemeSentenceChineseSchema = z
  .object({
    originalSentence: z.string().min(1),
    separateWords: z.array(z.string().min(1)).min(1),
    pinyin: z.array(z.string().min(1)).min(1)
  })
  .superRefine((data, ctx) => {
    if (data.separateWords.length !== data.pinyin.length) {
      ctx.addIssue({
        code: "custom",
        path: ["length"],
        message: "separateWords and pinyin must have the same length"
      });
    }
  });

export const MorphemeDataAlphabeticSchema = z.object({
  type: z.literal("alphabetic"),
  sourceLang: z.string().min(2),
  sentences: z.array(MorphemeSentenceAlphabeticSchema).min(1)
});

export const MorphemeDataChineseSchema = z.object({
  type: z.literal("chinese"),
  sourceLang: z.string().min(2),
  sentences: z.array(MorphemeSentenceChineseSchema).min(1)
});

export const MorphemeDataSchema = z.discriminatedUnion("type", [
  MorphemeDataChineseSchema,
  MorphemeDataAlphabeticSchema
]);

export type MorphemeSentenceAlphabetic = z.infer<typeof MorphemeSentenceAlphabeticSchema>;
export type MorphemeSentenceChinese = z.infer<typeof MorphemeSentenceChineseSchema>;
export type MorphemeDataAlphabetic = z.infer<typeof MorphemeDataAlphabeticSchema>;
export type MorphemeDataChinese = z.infer<typeof MorphemeDataChineseSchema>;
export type MorphemeData = z.infer<typeof MorphemeDataSchema>;
