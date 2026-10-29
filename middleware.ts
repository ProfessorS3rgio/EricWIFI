import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "./lib/session";

const publicPrefixes = ["/login", "/customer", "/api/login", "/_next", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const isPublic = request.nextUrl.pathname === "/" || publicPrefixes.some((path) => request.nextUrl.pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  if (!(await isValidSession(request.cookies.get("ericwifi_session")?.value))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"]
};
