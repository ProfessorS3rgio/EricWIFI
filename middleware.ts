import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/customer", "/api/login", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.cookies.get("ericwifi_session")?.value !== "authenticated") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"]
};
