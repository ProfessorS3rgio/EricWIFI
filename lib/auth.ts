import "server-only";
import { cookies } from "next/headers";
import { isValidSession } from "./session";
export async function authorized() {
  return isValidSession((await cookies()).get("ericwifi_session")?.value);
}
export async function requireAdmin() {
  if (!(await authorized()))
    throw new Error("Your session has expired. Please sign in again.");
}
