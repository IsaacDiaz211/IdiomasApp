import { ZodType } from "zod";

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    //todo: improve error structure in the routes with an 400 error
    const issues = res.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw Object.assign(new Error("ValidationError"), { issues });
  }
  return res.data;
}