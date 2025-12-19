import { z } from "zod";
import { supportedLanguages } from "./languages";
import { t, Static } from 'elysia';

export const TextRequestSchema = z.object({
  text: z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .refine((s) => s.length > 0, "text must not be empty")
    .refine((s) => s.length <= 450, `text must be <= 450 chars`),

  l1: z.string().transform((s) => s.trim().toLowerCase()),
  l2: z.string().transform((s) => s.trim().toLowerCase()),
}).superRefine((data, ctx) => {
  if (data.l1 === data.l2) {
    ctx.addIssue({ code: "custom", path: ["l2"], message: "l2 must be different from l1" });
  }
  const allowed = new Set(supportedLanguages);
  if (!allowed.has(data.l1 as any)) {
    ctx.addIssue({ code: "custom", path: ["l1"], message: `unsupported l1: ${data.l1}` });
  }
  if (!allowed.has(data.l2 as any)) {
    ctx.addIssue({ code: "custom", path: ["l2"], message: `unsupported l2: ${data.l2}` });
  }
});

export type TextRequest = z.infer<typeof TextRequestSchema>;

// Elysia schema equivalent intent to the Zod schema above

const CleanText = t.Transform(
    t.String({
        minLength: 1, 
        maxLength: 450,
        error: "The text must be between 1 and 450 characters"
    })
).Decode(value => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (cleaned.length === 0) throw new Error("text must not be empty");
    return cleaned;
}).Encode(value => value);

export const TextRequestElysiaSchema = t.Transform(
  t.Object({
    text: CleanText,
    l1: t.String(),
    l2: t.String()
  })
).Decode(data => {
    const l1 = data.l1.trim().toLowerCase();
    const l2 = data.l2.trim().toLowerCase();
    if (l1 === l2) {
        throw new Error("l2 must be different from l1");
    }
    const allowed = new Set(supportedLanguages);
    if (!allowed.has(l1)) throw new Error(`unsupported l1: ${l1}`);
    if (!allowed.has(l2)) throw new Error(`unsupported l2: ${l2}`);

    return {
      ...data,
      l1,
      l2
    };
}).Encode(data => data);


export type TextToTranslateRequest = Static<typeof TextRequestElysiaSchema>;
