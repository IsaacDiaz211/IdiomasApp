import { Elysia } from "elysia";
import { verifyAttestationToken } from "../auth/tokens";

const parseBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const [type, value] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
};

export const AuthMiddleware = new Elysia({ name: "AuthMiddleware" })
  .onBeforeHandle(async ({ headers, set }) => {
    const token = parseBearerToken(headers.authorization);
    if (!token) {
      set.status = 401;
      return { error: "Missing or invalid Authorization header" };
    }

    try {
      await verifyAttestationToken(token);
    } catch (error) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }
  });
