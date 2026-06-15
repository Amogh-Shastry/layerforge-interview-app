/**
 * Lightweight HR authentication for the dashboard.
 *
 * Uses an HMAC-signed, httpOnly session cookie. All crypto here is Web Crypto
 * (`crypto.subtle`) and base64url via `btoa`/`atob`, so this module runs in BOTH
 * the Edge proxy (proxy.ts) and Node route handlers without modification.
 *
 * Credentials are checked against env vars (HR_USERNAME / HR_PASSWORD) — a single
 * HR gate suitable for this app. The signing secret is AUTH_SECRET (falling back
 * to NEXTAUTH_SECRET).
 */

export const SESSION_COOKIE = "hr_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours, in seconds

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-insecure-secret-change-me"
  );
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface SessionPayload {
  sub: string;
  role: string;
  exp: number;
}

export async function createSessionToken(sub: string, role = "HR"): Promise<string> {
  const payload: SessionPayload = {
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payloadStr = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(payloadStr));
  return `${payloadStr}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, sig] = parts;

  const expected = b64urlEncode(await hmac(payloadStr));
  const enc = new TextEncoder();
  if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadStr))
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Validate submitted HR credentials against the configured env values. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.HR_USERNAME || "admin";
  const expectedPass = process.env.HR_PASSWORD || "layerforge";
  const enc = new TextEncoder();
  const userOk = timingSafeEqual(enc.encode(username), enc.encode(expectedUser));
  const passOk = timingSafeEqual(enc.encode(password), enc.encode(expectedPass));
  return userOk && passOk;
}
