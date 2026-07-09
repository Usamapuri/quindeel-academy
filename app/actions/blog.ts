"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// New posts start hidden (draft) so visitors never see a half-written post; the
// teacher fills it in inline, then flips it to Published.
export async function addBlogPost() {
  await requireRole("TEACHER");
  await prisma.blogPost.create({ data: { published: false } });
  revalidatePath("/blog");
}

export async function deleteBlogPost(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.blogPost.deleteMany({ where: { id } });
  revalidatePath("/blog");
}

export async function toggleBlogPublished(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const published = String(formData.get("published") || "") === "true";
  await prisma.blogPost.updateMany({ where: { id }, data: { published: !published } });
  revalidatePath("/blog");
}
