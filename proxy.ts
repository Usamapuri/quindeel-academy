import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyJwt } from "./lib/jwt";

// Gate /admin (TEACHER) and /portal (STUDENT). Runs on the edge — jose only, no bcrypt.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJwt(token) : null;

  const loginUrl = new URL("/login", req.url);

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(loginUrl);
    if (session.role !== "TEACHER") return NextResponse.redirect(new URL("/portal", req.url));
  }

  if (pathname.startsWith("/portal")) {
    if (!session) return NextResponse.redirect(loginUrl);
    if (session.role !== "STUDENT") return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
