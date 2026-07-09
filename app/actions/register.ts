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

  // Prevent duplicate pending requests: the same person (matched by email, or by
  // phone when no email) may not have two identical NEW requests for the same
  // course awaiting a decision at once. A request that was already processed
  // (APPROVED/REJECTED) does NOT block sending a fresh one.
  const identity = email
    ? { email: { equals: email, mode: "insensitive" as const } }
    : { phone };
  const existingPending = await prisma.registrationRequest.findFirst({
    where: { ...identity, courseId, status: "NEW" },
  });
  if (existingPending) {
    // Already have an open request — treat as success without creating a duplicate.
    return { ok: true };
  }

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
