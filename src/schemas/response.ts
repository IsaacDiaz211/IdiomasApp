import { z } from "zod";

export const TextResponseSchema = z.object({
  request_id: z.uuid(),
  translatedText: z.string(),
  glossedText: z.string(),
});

export type TextResponse = z.infer<typeof TextResponseSchema>;