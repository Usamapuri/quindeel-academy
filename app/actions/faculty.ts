"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// ---------- Categories ----------
export async function addCategory() {
  await requireRole("TEACHER");
  const count = await prisma.facultyCategory.count();
  await prisma.facultyCategory.create({ data: { order: count } });
  revalidatePath("/about");
}

export async function deleteCategory(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.facultyCategory.deleteMany({ where: { id } }); // members cascade
  revalidatePath("/about");
}

export async function moveCategory(formData: FormData) {
  await requireRole("TEACHER");
  await swapOrder("category", String(formData.get("id") || ""), String(formData.get("dir") || ""));
  revalidatePath("/about");
}

// ---------- Members ----------
export async function addFaculty(formData: FormData) {
  await requireRole("TEACHER");
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) return;
  const count = await prisma.faculty.count({ where: { categoryId } });
  await prisma.faculty.create({ data: { categoryId, order: count } });
  revalidatePath("/about");
}

export async function deleteFaculty(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.faculty.deleteMany({ where: { id } });
  revalidatePath("/about");
}

export async function moveFaculty(formData: FormData) {
  await requireRole("TEACHER");
  await swapOrder("member", String(formData.get("id") || ""), String(formData.get("dir") || ""));
  revalidatePath("/about");
}

// Swap the `order` of an item with its up/down neighbour (scoped to its category
// for members). Mirrors the course reorder.
async function swapOrder(kind: "category" | "member", id: string, dir: string) {
  if (!id || (dir !== "up" && dir !== "down")) return;
  if (kind === "category") {
    const all = await prisma.facultyCategory.findMany({ orderBy: { order: "asc" } });
    const idx = all.findIndex((c) => c.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= all.length) return;
    await prisma.$transaction([
      prisma.facultyCategory.update({ where: { id: all[idx].id }, data: { order: all[swap].order } }),
      prisma.facultyCategory.update({ where: { id: all[swap].id }, data: { order: all[idx].order } }),
    ]);
  } else {
    const me = await prisma.faculty.findUnique({ where: { id } });
    if (!me) return;
    const all = await prisma.faculty.findMany({ where: { categoryId: me.categoryId }, orderBy: { order: "asc" } });
    const idx = all.findIndex((f) => f.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= all.length) return;
    await prisma.$transaction([
      prisma.faculty.update({ where: { id: all[idx].id }, data: { order: all[swap].order } }),
      prisma.faculty.update({ where: { id: all[swap].id }, data: { order: all[idx].order } }),
    ]);
  }
}
