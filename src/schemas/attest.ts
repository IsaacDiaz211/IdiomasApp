import { t } from "elysia";

export const AttestationRequestSchema = t.Object({
  integrityToken: t.String({
    minLength: 1,
    error: "integrityToken is required"
  })
});

export const AttestationResponseSchema = t.Object({
  token: t.String(),
  expiresIn: t.Number()
});
