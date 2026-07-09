"use server";

import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";

export type RegisterState = { ok?: boolean; error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const ur = (await getLang()) === "ur";
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();
  const slotRaw = String(formData.get("preferredSlot") || "").trim();

  if (!name || !phone) {
    return { error: ur ? "براہ کرم اپنا نام اور فون نمبر درج کریں۔" : "Please enter your name and phone number." };
  }
  // The phone must actually be a number — require at least 7 digits (ignoring
  // spaces, +, -, brackets). Blocks letters / junk being submitted.
  if (phone.replace(/\D/g, "").length < 7) {
    return { error: ur ? "براہ کرم درست فون نمبر درج کریں (صرف ہندسے)۔" : "Please enter a valid phone number (digits only)." };
  }

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
