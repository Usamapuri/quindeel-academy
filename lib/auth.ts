// Node-runtime auth helpers (bcrypt + cookies). Used in Server Components and Server Actions.
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signJwt, verifyJwt, type SessionPayload } from "./jwt";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signJwt(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

/** Return the session or redirect to /login. Optionally enforce a role. */
export async function requireRole(
  role?: "TEACHER" | "STUDENT"
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) {
    redirect(session.role === "TEACHER" ? "/admin" : "/portal");
  }
  return session;
}
