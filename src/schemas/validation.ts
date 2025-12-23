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