"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const TOKEN_KEY = "testimonial_token";

// --- Teacher-managed testimonials (unchanged behaviour) --------------------

export async function addTestimonial() {
  await requireRole("TEACHER");
  await prisma.testimonial.create({ data: { status: "approved" } });
  revalidatePath("/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.testimonial.deleteMany({ where: { id } });
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}

// Approve a pending submission (publish it) or send a live one back to pending.
export async function setTestimonialStatus(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || (status !== "approved" && status !== "pending")) return;
  await prisma.testimonial.updateMany({ where: { id }, data: { status } });
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}

// --- Shareable submission link ---------------------------------------------

// The current shareable token, creating one on first use so the link always works.
export async function getTestimonialToken(): Promise<string> {
  await requireRole("TEACHER");
  const existing = await prisma.siteSetting.findUnique({ where: { key: TOKEN_KEY } });
  if (existing?.value) return existing.value;
  const token = randomBytes(9).toString("base64url");
  await prisma.siteSetting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: token },
    create: { key: TOKEN_KEY, value: token },
  });
  return token;
}

// Roll a fresh token — any old link stops working immediately.
export async function regenerateTestimonialLink() {
  await requireRole("TEACHER");
  const token = randomBytes(9).toString("base64url");
  await prisma.siteSetting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: token },
    create: { key: TOKEN_KEY, value: token },
  });
  revalidatePath("/admin/testimonials");
}

// --- Public submission (NO auth — anyone with the link) --------------------

export type SubmitState = { ok?: boolean; error?: string };

// Called by the public /testify/<token> form. Validates the token, then stores a
// PENDING testimonial the teacher must approve before it appears anywhere.
export async function submitTestimonial(
  token: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: TOKEN_KEY } });
  // Constant work either way; a missing/mismatched token is simply rejected.
  if (!setting?.value || !token || token !== setting.value) {
    return { error: "invalid-link" };
  }

  const author = String(formData.get("author") || "").trim().slice(0, 120);
  const role = String(formData.get("role") || "").trim().slice(0, 120);
  const quote = String(formData.get("quote") || "").trim().slice(0, 2000);
  const photoRaw = String(formData.get("photo") || "").trim();

  if (!author || !quote) return { error: "missing" };

  // Photo is optional; only accept a reasonably-sized inline JPEG/PNG data URL.
  const photo =
    photoRaw && /^data:image\/(jpeg|png|webp);base64,/.test(photoRaw) && photoRaw.length < 3_000_000
      ? photoRaw
      : "";

  await prisma.testimonial.create({ data: { author, role, quote, photo, status: "pending" } });
  revalidatePath("/admin/testimonials");
  return { ok: true };
}
