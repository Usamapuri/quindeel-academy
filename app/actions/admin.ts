"use server";

import { randomBytes } from "crypto";
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

export async function deleteLearner(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  // Only ever delete STUDENT accounts — never the teacher, even with a crafted id.
  // Enrollment and FeeRecord rows cascade-delete via their onDelete: Cascade relations.
  await prisma.user.deleteMany({ where: { id, role: "STUDENT" } });
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

function revalidateRegistrations() {
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/learners");
  revalidatePath("/portal");
}

// Ensure the student account exists for a given email, creating it (with the
// supplied password) if it doesn't. Returns the user, or null when creation is
// needed but no password was provided.
async function ensureStudent(
  email: string,
  fallbackName: string,
  fallbackPhone: string,
  password: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  if (!password) return null;
  return prisma.user.create({
    data: {
      name: fallbackName,
      email,
      phone: fallbackPhone,
      role: "STUDENT",
      passwordHash: await hashPassword(password),
    },
  });
}

// Decide a whole pending group (all NEW requests for one email) in one shot.
// Checkbox `approve` carries the request ids the teacher left checked → APPROVED
// (+ enrolment); every other request in `all` → REJECTED. If the student has no
// account yet, one is created from `password` (required only when approving).
export async function decideRegistrations(formData: FormData) {
  await requireRole("TEACHER");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const allIds = String(formData.get("all") || "").split(",").filter(Boolean);
  const approvedIds = new Set(formData.getAll("approve").map(String));
  const password = String(formData.get("password") || "");
  if (!email || allIds.length === 0) return;

  const reqs = await prisma.registrationRequest.findMany({ where: { id: { in: allIds } } });
  const approving = reqs.filter((r) => approvedIds.has(r.id) && r.courseId);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user && approving.length > 0) {
    user = await ensureStudent(email, reqs[0]?.name ?? "Student", reqs[0]?.phone ?? "", password);
    if (!user) return; // approval requested but no password supplied — abort, teacher retries
  }

  for (const r of reqs) {
    const approve = approvedIds.has(r.id);
    if (approve && user && r.courseId) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: user.id, courseId: r.courseId } },
        update: {},
        create: { studentId: user.id, courseId: r.courseId },
      });
    }
    await prisma.registrationRequest.update({
      where: { id: r.id },
      data: { status: approve ? "APPROVED" : "REJECTED" },
    });
  }
  revalidateRegistrations();
}

// Flip a single already-decided request between APPROVED and REJECTED, keeping
// the matching enrolment in sync. Used by the Approved/Rejected tabs so a
// decision can be changed later. Approving when no account exists yet creates
// one with a temporary password (teacher resets it in Learners).
export async function setRegistrationCourseStatus(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as "APPROVED" | "REJECTED";
  if (!id || (status !== "APPROVED" && status !== "REJECTED")) return;

  const req = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!req) return;
  const email = req.email.trim().toLowerCase();

  if (status === "APPROVED") {
    let user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user && email) {
      // Edge case: re-approving a registrant who never got an account. Create one
      // with a temporary password; the teacher sets a real one in Learners.
      const temp = randomBytes(9).toString("base64url");
      user = await ensureStudent(email, req.name, req.phone, temp);
    }
    if (user && req.courseId) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: user.id, courseId: req.courseId } },
        update: {},
        create: { studentId: user.id, courseId: req.courseId },
      });
    }
    await prisma.registrationRequest.update({ where: { id }, data: { status: "APPROVED" } });
  } else {
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (user && req.courseId) {
      await prisma.enrollment.deleteMany({ where: { studentId: user.id, courseId: req.courseId } });
    }
    await prisma.registrationRequest.update({ where: { id }, data: { status: "REJECTED" } });
  }
  revalidateRegistrations();
}

// ---------- Fee records ----------
export async function addFeeRecord(formData: FormData) {
  await requireRole("TEACHER");
  const studentId = String(formData.get("studentId") || "");
  // Zero, one, or many courses may be charged in a single fee. The client sums
  // their prices and applies the discount into `amount`; we store that total.
  const courseIds = formData.getAll("courseId").map(String).filter(Boolean);
  const period = String(formData.get("period") || "").trim();
  const amount = parseInt(String(formData.get("amount") || "0"), 10) || 0;
  const discount = Math.min(100, Math.max(0, parseInt(String(formData.get("discount") || "0"), 10) || 0));
  const status = String(formData.get("status") || "DUE") as "PAID" | "DUE" | "PARTIAL";
  let note = String(formData.get("note") || "").trim();
  // Amount is required and must be positive.
  if (!studentId || !period || amount <= 0) return;

  // A single course links directly; multiple courses can't fit one column, so
  // we record the breakdown in the note instead.
  const courseId = courseIds.length === 1 ? courseIds[0] : null;
  if (courseIds.length > 0) {
    const cs = await prisma.course.findMany({ where: { id: { in: courseIds } } });
    const list = cs.map((c) => c.titleEn).join(", ");
    const suffix = `Courses: ${list}${discount > 0 ? ` (−${discount}% discount)` : ""}`;
    note = note ? `${note} · ${suffix}` : suffix;
  }

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
  revalidatePath("/portal");
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
  if (!id) return;
  const record = await prisma.feeRecord.findUnique({ where: { id } });
  if (!record) return;
  // A PAID fee is the student's receipt — keep it for them by soft-deleting
  // (hidden from the teacher's list only). DUE/PARTIAL are removed entirely.
  if (record.status === "PAID") {
    await prisma.feeRecord.update({ where: { id }, data: { deletedAt: new Date() } });
  } else {
    await prisma.feeRecord.delete({ where: { id } });
  }
  revalidatePath("/admin/fees");
  revalidatePath("/portal");
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
