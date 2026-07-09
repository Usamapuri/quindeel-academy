import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/jwt";

// Clears the session cookie and sends the user to /login. requireRole redirects
// here when an account is deactivated mid-session — clearing the cookie (which
// can't be done during a page render) is what breaks the /portal ⇄ /login loop.
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?deactivated=1", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
