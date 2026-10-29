const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function toBase64Url(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export async function createSession() {
  const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const encodedPayload = toBase64Url(new TextEncoder().encode(payload));
  return `${encodedPayload}.${await signature(encodedPayload, sessionSecret())}`;
}

export async function isValidSession(value: string | undefined) {
  if (!value) return false;
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) return false;

  const expectedSignature = await signature(encodedPayload, sessionSecret());
  if (providedSignature.length !== expectedSignature.length) return false;
  const signatureBytes = new TextEncoder().encode(providedSignature);
  const expectedBytes = new TextEncoder().encode(expectedSignature);
  let difference = 0;
  for (let index = 0; index < signatureBytes.length; index += 1) difference |= signatureBytes[index] ^ expectedBytes[index];
  if (difference !== 0) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
