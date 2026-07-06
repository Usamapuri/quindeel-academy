import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeCode } from "@/lib/google";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/admin/google?error=1", req.url));
  try {
    await exchangeCode(code);
  } catch (e) {
    console.error("Google OAuth exchange failed:", e);
    return NextResponse.redirect(new URL("/admin/google?error=1", req.url));
  }
  return NextResponse.redirect(new URL("/admin/google?connected=1", req.url));
}
