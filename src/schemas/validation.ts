/* A Zod validation helper that throws a detailed error on failure
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
}*/

// An Elysia validation helper that throws a detailed error on failure

import { TypeCompiler } from '@sinclair/typebox/compiler'
import { type TSchema, type Static } from 'elysia'

export function parseOrThrow<T extends TSchema>(schema: T, input: unknown): Static<T> {
  // The schema exists at runtime as 'schema'
  const C = TypeCompiler.Compile(schema)

  // Check if the input is valid
  const isValid = C.Check(input)

  if (!isValid) {
    const issues = [...C.Errors(input)].map((i) => ({
      path: i.path,
      message: i.message,
    }))
    
    throw Object.assign(new Error("ValidationError"), { issues })
  }

  // If valid, return the input typed as Static<T>
  return C.Decode(input)
}