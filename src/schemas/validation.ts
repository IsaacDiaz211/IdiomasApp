import { ZodType } from "zod";

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    const issues = res.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw Object.assign(new Error("ValidationError"), { issues });
  }
  return res.data;
}