"use server";

import { revalidatePath } from "next/cache";
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

// A student asks to LEAVE a course. We verify (by email) that they are actually
// enrolled in it before recording the request; the teacher makes the final call.
export async function unregisterAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const ur = (await getLang()) === "ur";
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const courseId = String(formData.get("courseId") || "").trim();

  if (!name || !phone || !email) {
    return { error: ur ? "براہ کرم اپنا نام، فون اور ای میل درج کریں۔" : "Please enter your name, phone and email." };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { error: ur ? "براہ کرم درست فون نمبر درج کریں۔" : "Please enter a valid phone number." };
  }
  if (!courseId) {
    return { error: ur ? "براہ کرم وہ کورس منتخب کریں جو آپ چھوڑنا چاہتے ہیں۔" : "Please select the course you want to leave." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const enrolled = user
    ? await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId } })
    : null;
  if (!user || !enrolled) {
    return {
      error: ur
        ? "اس ای میل کے ساتھ آپ اس کورس میں اندراج شدہ نہیں ہیں۔"
        : "You are not enrolled in this course with that email.",
    };
  }

  // One pending unregister request per email+course.
  const existing = await prisma.unregisterRequest.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, courseId, status: "NEW" },
  });
  if (!existing) {
    await prisma.unregisterRequest.create({ data: { name, phone, email, courseId, status: "NEW" } });
    revalidatePath("/admin/registrations");
  }
  return { ok: true };
}
