import { supportedLanguages } from "./languages";
import { t, Static } from 'elysia';

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

export const TextRequestSchema = t.Transform(
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


export type TextToTranslateRequest = Static<typeof TextRequestSchema>;
