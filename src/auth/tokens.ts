import { SignJWT, jwtVerify } from "jose";

const TOKEN_TTL_SECONDS = 15 * 60;

const getJwtSecret = (): Uint8Array => {
  const secret = process.env.ATTESTATION_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing ATTESTATION_JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
};

export const issueAttestationToken = async (payload: Record<string, unknown>): Promise<string> => {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(secret);
};

export const verifyAttestationToken = async (token: string): Promise<Record<string, unknown>> => {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as Record<string, unknown>;
};

export const getTokenTtlSeconds = (): number => TOKEN_TTL_SECONDS;
