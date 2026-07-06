"use server";

import { prisma } from "@/lib/db";

export type RegisterState = { ok?: boolean; error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();
  const slotRaw = String(formData.get("preferredSlot") || "").trim();

  if (!name || !phone) return { error: "Please enter your name and phone number." };

  const preferredSlot = slotRaw ? new Date(slotRaw) : null;

  await prisma.registrationRequest.create({
    data: {
      name,
      phone,
      email,
      courseId: courseId || undefined,
      message,
      preferredSlot: preferredSlot && !isNaN(preferredSlot.getTime()) ? preferredSlot : undefined,
    },
  });

  return { ok: true };
}
