// Edge-safe JWT helpers (jose only — no bcrypt / next-headers so middleware can import this).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "qa_session";

export type SessionPayload = {
  sub: string; // user id
  role: "TEACHER" | "STUDENT";
  name: string;
  email: string;
};

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-insecure-secret");

export async function signJwt(p: SessionPayload): Promise<string> {
  return new SignJWT({ role: p.role, name: p.name, email: p.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      role: payload.role as SessionPayload["role"],
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
