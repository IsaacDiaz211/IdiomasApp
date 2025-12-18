import { z } from "zod";
import { supportedLanguages } from "./languages";

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