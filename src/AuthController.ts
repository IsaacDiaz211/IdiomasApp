import { Elysia, t } from "elysia";
import { AttestationRequestSchema, AttestationResponseSchema } from "./schemas/attest";
import { verifyPlayIntegrityToken } from "./auth/playIntegrity";
import { issueAttestationToken, getTokenTtlSeconds } from "./auth/tokens";

const AuthController = new Elysia()
  .post(
    "/auth/attest",
    async ({ body, set }) => {
      try {
        const result = await verifyPlayIntegrityToken(body.integrityToken);
        const token = await issueAttestationToken({
          packageName: result.packageName,
          appRecognitionVerdict: result.appRecognitionVerdict,
          deviceRecognitionVerdict: result.deviceRecognitionVerdict
        });

        return {
          token,
          expiresIn: getTokenTtlSeconds()
        };
      } catch (error) {
        set.status = 401;
        return {
          error: "Attestation failed"
        };
      }
    },
    {
      body: AttestationRequestSchema,
      response: {
        200: AttestationResponseSchema,
        401: t.Object({ error: t.String() })
      }
    }
  );

export { AuthController };
