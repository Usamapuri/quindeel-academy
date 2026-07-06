"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `course-${Date.now()}`
  );
}

// ---------- Learners ----------
export async function createLearner(formData: FormData) {
  await requireRole("TEACHER");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  if (!name || !email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  await prisma.user.create({
    data: { name, email, phone, role: "STUDENT", passwordHash: await hashPassword(password) },
  });
  revalidatePath("/admin/learners");
}

export async function resetLearnerPassword(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id || !password) return;
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/learners");
}

export async function toggleLearnerActive(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  await prisma.user.update({ where: { id }, data: { active: !active } });
  revalidatePath("/admin/learners");
}

export async function setEnrollment(formData: FormData) {
  await requireRole("TEACHER");
  const studentId = String(formData.get("studentId") || "");
  const courseId = String(formData.get("courseId") || "");
  const enroll = String(formData.get("enroll") || "") === "true";
  if (!studentId || !courseId) return;
  if (enroll) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: { studentId, courseId },
    });
  } else {
    await prisma.enrollment.deleteMany({ where: { studentId, courseId } });
  }
  revalidatePath("/admin/learners");
}

// ---------- Registration requests ----------
export async function approveRegistration(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!id || !email || !password) return;

  const req = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!req) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        name: req.name,
        email,
        phone: req.phone,
        role: "STUDENT",
        passwordHash: await hashPassword(password),
      },
    }));

  if (req.courseId) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: user.id, courseId: req.courseId } },
      update: {},
      create: { studentId: user.id, courseId: req.courseId },
    });
  }

  await prisma.registrationRequest.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/learners");
}

export async function rejectRegistration(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  await prisma.registrationRequest.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin/registrations");
}

// ---------- Fee records ----------
export async function addFeeRecord(formData: FormData) {
  await requireRole("TEACHER");
  const studentId = String(formData.get("studentId") || "");
  const courseId = String(formData.get("courseId") || "") || null;
  const period = String(formData.get("period") || "").trim();
  const amount = parseInt(String(formData.get("amount") || "0"), 10) || 0;
  const status = String(formData.get("status") || "DUE") as "PAID" | "DUE" | "PARTIAL";
  const note = String(formData.get("note") || "").trim();
  if (!studentId || !period) return;
  await prisma.feeRecord.create({
    data: {
      studentId,
      courseId: courseId || undefined,
      period,
      amount,
      status,
      note,
      paidOn: status === "PAID" ? new Date() : null,
    },
  });
  revalidatePath("/admin/fees");
}

export async function setFeeStatus(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DUE") as "PAID" | "DUE" | "PARTIAL";
  await prisma.feeRecord.update({
    where: { id },
    data: { status, paidOn: status === "PAID" ? new Date() : null },
  });
  revalidatePath("/admin/fees");
}

export async function deleteFeeRecord(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  await prisma.feeRecord.delete({ where: { id } });
  revalidatePath("/admin/fees");
}

// ---------- Courses ----------
export async function addCourse(formData: FormData) {
  await requireRole("TEACHER");
  const titleEn = String(formData.get("titleEn") || "").trim();
  const titleUr = String(formData.get("titleUr") || "").trim();
  const feeText = String(formData.get("feeText") || "").trim();
  if (!titleEn) return;
  const count = await prisma.course.count();
  await prisma.course.create({
    data: { slug: slugify(titleEn), titleEn, titleUr: titleUr || titleEn, feeText, order: count + 1 },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
}

export async function deleteCourse(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
}

export async function toggleCoursePublished(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const published = String(formData.get("published") || "") === "true";
  await prisma.course.update({ where: { id }, data: { published: !published } });
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
}

export async function moveCourse(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const dir = String(formData.get("dir") || "");
  const all = await prisma.course.findMany({ orderBy: { order: "asc" } });
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= all.length) return;
  const a = all[idx];
  const b = all[swapWith];
  await prisma.$transaction([
    prisma.course.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.course.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
}

// ---------- Recordings ----------
export async function addRecording(formData: FormData) {
  await requireRole("TEACHER");
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const descriptionUr = String(formData.get("descriptionUr") || "").trim();
  if (!courseId || !title || !url) return;
  await prisma.recording.create({ data: { courseId, title, url, descriptionEn, descriptionUr } });
  revalidatePath("/admin/recordings");
}

export async function deleteRecording(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  await prisma.recording.delete({ where: { id } });
  revalidatePath("/admin/recordings");
}
