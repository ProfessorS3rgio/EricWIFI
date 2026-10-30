import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSession, sessionSecret } from "../../../lib/session";
import { database } from "../../../lib/supabase";
function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  try {
    const { pin } = await request.json();
    const configured = process.env.ADMIN_MPIN?.trim();
    if (!configured || !/^\d{4}$/.test(configured))
      return NextResponse.json(
        {
          error:
            "Admin sign-in is not configured. Set ADMIN_MPIN to exactly four digits in your server environment, then restart or redeploy the app.",
        },
        { status: 503 },
      );
    sessionSecret();
    const correct =
      typeof pin === "string" &&
      /^\d{4}$/.test(pin) &&
      timingSafeEqual(Buffer.from(pin), Buffer.from(configured));
    const { data: permitted, error } = await database().rpc(
      "check_login_attempt",
      { p_success: correct },
    );
    if (error)
      return NextResponse.json(
        { error: "Sign-in is unavailable. Check the database migration." },
        { status: 503 },
      );
    if (!permitted)
      return NextResponse.json(
        {
          error:
            "MPIN incorrect or sign-in temporarily locked. After 10 failed attempts, wait 15 minutes.",
        },
        { status: 401 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set("ericwifi_session", await createSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "Sign-in is unavailable. Check the server configuration and try again.",
      },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("ericwifi_session");
  return response;
}
