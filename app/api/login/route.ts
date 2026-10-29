import { NextResponse } from "next/server";
import { createSession } from "../../../lib/session";

export async function POST(request: Request) {
  const { pin } = (await request.json()) as { pin?: string };
  const configuredPin = process.env.ADMIN_MPIN;

  if (!configuredPin) {
    return NextResponse.json({ error: "ADMIN_MPIN is not configured." }, { status: 500 });
  }

  if (!pin || pin.length !== 4 || pin !== configuredPin) {
    return NextResponse.json({ error: "Incorrect MPIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ericwifi_session", await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("ericwifi_session");
  return response;
}
