import { GoogleAuth } from "google-auth-library";

type PlayIntegrityPayload = {
  requestDetails?: {
    requestPackageName?: string;
    timestampMillis?: string;
  };
  appIntegrity?: {
    appRecognitionVerdict?: string;
  };
  deviceIntegrity?: {
    deviceRecognitionVerdict?: string[];
  };
};

type PlayIntegrityResult = {
  packageName: string;
  appRecognitionVerdict: string;
  deviceRecognitionVerdict: string[];
  timestampMillis?: string;
};

const INTEGRITY_SCOPE = "https://www.googleapis.com/auth/playintegrity";

const getPackageName = (): string => {
  const packageName = process.env.PLAY_INTEGRITY_PACKAGE_NAME?.trim();
  if (!packageName) {
    throw new Error("Missing PLAY_INTEGRITY_PACKAGE_NAME");
  }
  return packageName;
};

const getServiceAccount = (): Record<string, unknown> => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
  }
};

const ensureDeviceIntegrity = (verdicts?: string[]): boolean => {
  if (!verdicts || verdicts.length === 0) return false;
  return verdicts.includes("MEETS_DEVICE_INTEGRITY") || verdicts.includes("MEETS_STRONG_INTEGRITY");
};

export const verifyPlayIntegrityToken = async (integrityToken: string): Promise<PlayIntegrityResult> => {
  const packageName = getPackageName();
  const credentials = getServiceAccount();

  const auth = new GoogleAuth({
    credentials,
    scopes: [INTEGRITY_SCOPE]
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse?.token;

  if (!accessToken) {
    throw new Error("Failed to obtain Play Integrity access token");
  }

  const response = await fetch(
    `https://playintegrity.googleapis.com/v1/${packageName}:decodeIntegrityToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ integrityToken })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Play Integrity decode failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const payload = data?.tokenPayloadExternal as PlayIntegrityPayload | undefined;

  if (!payload?.requestDetails?.requestPackageName) {
    throw new Error("Play Integrity payload missing request package name");
  }

  if (payload.requestDetails.requestPackageName !== packageName) {
    throw new Error("Play Integrity package name mismatch");
  }

  const appVerdict = payload.appIntegrity?.appRecognitionVerdict || "";
  if (appVerdict !== "PLAY_RECOGNIZED") {
    throw new Error("Play Integrity app recognition failed");
  }

  const deviceVerdicts = payload.deviceIntegrity?.deviceRecognitionVerdict || [];
  if (!ensureDeviceIntegrity(deviceVerdicts)) {
    throw new Error("Play Integrity device recognition failed");
  }

  return {
    packageName,
    appRecognitionVerdict: appVerdict,
    deviceRecognitionVerdict: deviceVerdicts,
    timestampMillis: payload.requestDetails.timestampMillis
  };
};
