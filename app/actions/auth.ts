"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Please enter your email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { error: "Invalid email or password." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  await createSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect(user.role === "TEACHER" ? "/admin" : "/portal");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
