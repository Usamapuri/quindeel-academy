"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// A logged-in student requests enrolment in one or more courses at once. Because
// they are already authenticated we take their name/email/phone from their
// account — no re-entering credentials. Each selected course becomes a NEW
// RegistrationRequest the teacher decides on (approve/reject) in the admin panel.
export async function requestCourses(formData: FormData) {
  const session = await requireRole("STUDENT");
  const courseIds = formData.getAll("courseId").map(String).filter(Boolean);
  if (courseIds.length === 0) return;

  const student = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!student) return;

  // Skip courses the student is already enrolled in, or already has an open
  // (NEW) request for, so the teacher never sees duplicate pending rows.
  const [enrollments, openRequests] = await Promise.all([
    prisma.enrollment.findMany({ where: { studentId: student.id }, select: { courseId: true } }),
    prisma.registrationRequest.findMany({
      where: { email: student.email, status: "NEW" },
      select: { courseId: true },
    }),
  ]);
  const taken = new Set([
    ...enrollments.map((e) => e.courseId),
    ...openRequests.map((r) => r.courseId).filter((c): c is string => Boolean(c)),
  ]);

  const toCreate = courseIds.filter((id) => !taken.has(id));
  if (toCreate.length === 0) return;

  await prisma.registrationRequest.createMany({
    data: toCreate.map((courseId) => ({
      name: student.name,
      email: student.email,
      phone: student.phone ?? "",
      courseId,
      status: "NEW" as const,
      message: "Requested from student portal",
    })),
  });

  revalidatePath("/portal");
  revalidatePath("/admin/registrations");
}
