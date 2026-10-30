export class DatabaseConfigError extends Error {}

export function validateDatabaseConfig(
  url: string | undefined,
  key: string | undefined,
) {
  if (!url || !key)
    throw new DatabaseConfigError(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the app.",
    );
  let publicKey = key.startsWith("sb_publishable_");
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString(),
    );
    publicKey ||= payload.role === "anon" || payload.role === "authenticated";
  } catch {
    /* Opaque secret keys do not have a JWT payload. */
  }
  if (publicKey)
    throw new DatabaseConfigError(
      "SUPABASE_SERVICE_ROLE_KEY contains a public key. Replace it in .env.local with your Supabase secret key (sb_secret_...) or legacy service_role key, then restart the app.",
    );
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new DatabaseConfigError(
      "NEXT_PUBLIC_SUPABASE_URL must be your Supabase project HTTP(S) URL.",
    );
  }
}
