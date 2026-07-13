"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function addTestimonial() {
  await requireRole("TEACHER");
  await prisma.testimonial.create({ data: {} });
  revalidatePath("/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.testimonial.deleteMany({ where: { id } });
  revalidatePath("/testimonials");
}
