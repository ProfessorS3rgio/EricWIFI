import { NextResponse } from "next/server";
import { authorized } from "./auth";
export async function mutationGuard(request: Request) {
  if (!(await authorized()))
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  return null;
}
export const invalid = (error: string) =>
  NextResponse.json({ error }, { status: 400 });
