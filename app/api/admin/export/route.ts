import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// One-click content backup for the teacher: downloads everything they've built
// (courses + inline edits, site copy, learners, enrolments, fees, classes,
// recordings, registrations) as a single JSON file. Teacher-only. Password
// hashes and Google tokens are intentionally excluded.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return new Response("Unauthorized", { status: 401 });
  }

  const [courses, settings, learners, enrollments, feeRecords, classSessions, recordings, registrations] =
    await Promise.all([
      prisma.course.findMany({ orderBy: { order: "asc" } }),
      prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, name: true, email: true, phone: true, active: true, createdAt: true },
      }),
      prisma.enrollment.findMany(),
      prisma.feeRecord.findMany(),
      prisma.classSession.findMany(),
      prisma.recording.findMany(),
      prisma.registrationRequest.findMany(),
    ]);

  const backup = {
    meta: { academy: "Quindeel Academy", exportedAt: new Date().toISOString(), version: 1 },
    courses,
    settings,
    learners,
    enrollments,
    feeRecords,
    classSessions,
    recordings,
    registrations,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="quindeel-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
