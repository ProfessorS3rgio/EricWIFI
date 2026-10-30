import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDatabaseConfig,
  DatabaseConfigError,
} from "../lib/database-config";

test("server database configuration rejects public keys and missing values without exposing them", () => {
  const url = "https://example.supabase.co";
  assert.throws(
    () => validateDatabaseConfig(url, "sb_publishable_example"),
    DatabaseConfigError,
  );
  const anon = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
  assert.throws(
    () => validateDatabaseConfig(url, anon),
    /contains a public key/,
  );
  assert.throws(() => validateDatabaseConfig(url, ""), /Set NEXT_PUBLIC/);
  assert.throws(
    () => validateDatabaseConfig("not-a-url", "sb_secret_example"),
    /HTTP/,
  );
  assert.doesNotThrow(() => validateDatabaseConfig(url, "sb_secret_example"));
  const service = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  assert.doesNotThrow(() => validateDatabaseConfig(url, service));
});
