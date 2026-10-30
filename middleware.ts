import { NextRequest, NextResponse } from "next/server";
import { isValidSession } from "./lib/session";
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPage =
    ["/", "/login", "/customer", "/api/login", "/favicon.ico"].includes(path) ||
    path.startsWith("/_next/");
  if (publicPage) return NextResponse.next();
  if (!(await isValidSession(request.cookies.get("ericwifi_session")?.value))) {
    if (path.startsWith("/api/"))
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 },
      );
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
