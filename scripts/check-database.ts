import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { validateDatabaseConfig } from "../lib/database-config";

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    validateDatabaseConfig(url, key);
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Invalid database configuration.",
    );
    process.exitCode = 1;
    return;
  }
  const db = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const checks = [
    ["clients", "id,portal_token"],
    ["bills", "id,clients(name)"],
    ["payments", "id,request_id,voided_at"],
    ["admin_login_guard", "id"],
  ];
  for (const [table, columns] of checks) {
    const { status, error } = await db.from(table).select(columns).limit(0);
    if (error) {
      // Print only controlled diagnostics: never keys, URLs, or customer records.
      console.error(
        `${table}: FAILED (HTTP ${status}, code ${error.code || "connection error"}).`,
      );
      console.error(
        status === 401 || status === 403
          ? "Check that the server secret key belongs to this Supabase project."
          : status === 404 || error.code === "42703"
            ? "Run the complete supabase/schema.sql in your project's SQL Editor."
            : "Check Supabase project availability and your network connection.",
      );
      process.exitCode = 1;
    } else console.log(`${table}: OK`);
  }
}
main().catch(() => {
  console.error(
    "Database check failed. Verify your configuration and network connection.",
  );
  process.exitCode = 1;
});
