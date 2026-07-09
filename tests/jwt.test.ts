import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, type SessionPayload } from "@/lib/jwt";

const payload: SessionPayload = {
  sub: "user-123",
  role: "TEACHER",
  name: "Prof. Test",
  email: "test@quindeel.academy",
};

describe("jwt round-trip", () => {
  it("signs and verifies, preserving the session fields", async () => {
    const token = await signJwt(payload);
    const back = await verifyJwt(token);
    expect(back).not.toBeNull();
    expect(back!.sub).toBe(payload.sub);
    expect(back!.role).toBe("TEACHER");
    expect(back!.name).toBe(payload.name);
    expect(back!.email).toBe(payload.email);
  });

  it("rejects garbage and tampered tokens", async () => {
    expect(await verifyJwt("not-a-jwt")).toBeNull();
    const token = await signJwt(payload);
    const tampered = token.slice(0, -3) + "abc"; // corrupt the signature
    expect(await verifyJwt(tampered)).toBeNull();
  });

  it("does not confuse a STUDENT token for a TEACHER", async () => {
    const student = await signJwt({ ...payload, role: "STUDENT" });
    const back = await verifyJwt(student);
    expect(back!.role).toBe("STUDENT");
  });
});
