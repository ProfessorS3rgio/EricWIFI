import "server-only";
import { createClient } from "@supabase/supabase-js";
import { validateDatabaseConfig } from "./database-config";

// Server-only: never expose the service role key to browser code.
export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  validateDatabaseConfig(url, key);
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
