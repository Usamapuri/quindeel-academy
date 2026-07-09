import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Teacher-only Excel export: a workbook with a sheet per area (Students with their
// courses + fee totals, every Fee, Courses, Classes, Recordings, Registrations).
// Password hashes and Google tokens are intentionally excluded.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return new Response("Unauthorized", { status: 401 });
  }

  const [learners, courses, fees, classes, recordings, registrations] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      include: { enrollments: { include: { course: true } } },
    }),
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.feeRecord.findMany({
      where: { deletedAt: null },
      orderBy: [{ period: "desc" }],
      include: { student: true, course: true },
    }),
    prisma.classSession.findMany({ orderBy: { startsAt: "desc" }, include: { course: true } }),
    prisma.recording.findMany({ orderBy: { createdAt: "desc" }, include: { course: true } }),
    prisma.registrationRequest.findMany({ orderBy: { createdAt: "desc" }, include: { course: true } }),
  ]);

  // Deleted fees are kept in the DB — export them too, grouped by status.
  const deletedFees = await prisma.feeRecord.findMany({
    where: { deletedAt: { not: null } },
    orderBy: [{ status: "asc" }, { period: "desc" }],
    include: { student: true, course: true },
  });

  const fmtDate = (d: Date | null) => (d ? new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Quindeel Academy";

  const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1F6FB2" } };

  const sheet = (name: string, columns: Partial<ExcelJS.Column>[], rows: Record<string, unknown>[]) => {
    const ws = wb.addWorksheet(name);
    ws.columns = columns;
    ws.getRow(1).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = HEADER_FILL;
    });
    rows.forEach((r) => ws.addRow(r));
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  // A fee sheet split into status "branches" (Paid / Due / Partially paid), each a
  // labelled colour band. The active sheet also gets an Outstanding total.
  const BRANCH = {
    PAID: { label: "PAID", color: "FF2E7D32" },
    DUE: { label: "DUE", color: "FFC62828" },
    PARTIAL: { label: "PARTIALLY PAID", color: "FFB26A00" },
  } as const;

  const feeSheet = (
    name: string,
    source: typeof fees,
    opts: { deletedOn?: boolean; outstanding?: boolean },
  ) => {
    const ws = wb.addWorksheet(name);
    const cols: Partial<ExcelJS.Column>[] = [
      { header: "Student", key: "student", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Course", key: "course", width: 26 },
      { header: "Period", key: "period", width: 12 },
      { header: "Amount (PKR)", key: "amount", width: 14 },
      { header: "Paid On", key: "paidOn", width: 16 },
      ...(opts.deletedOn ? [{ header: "Deleted On", key: "deletedOn", width: 16 }] : []),
      { header: "Note", key: "note", width: 30 },
    ];
    ws.columns = cols;
    ws.getRow(1).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = HEADER_FILL;
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const n = cols.length;
    const band = (text: string, argb: string) => {
      const r = ws.addRow([text]);
      ws.mergeCells(r.number, 1, r.number, n);
      const c = r.getCell(1);
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    };

    (["PAID", "DUE", "PARTIAL"] as const).forEach((st) => {
      const rows = source.filter((f) => f.status === st);
      band(`${BRANCH[st].label} (${rows.length})`, BRANCH[st].color);
      rows.forEach((f) =>
        ws.addRow({
          student: f.student.name,
          email: f.student.email,
          course: f.course?.titleEn ?? "",
          period: f.period,
          amount: f.amount,
          paidOn: fmtDate(f.paidOn),
          deletedOn: fmtDate(f.deletedAt),
          note: f.note,
        }),
      );
      ws.addRow([]);
    });

    if (opts.outstanding) {
      const unpaid = source.filter((f) => f.status !== "PAID");
      const owed = unpaid.reduce((s, f) => s + f.amount, 0);
      band("OUTSTANDING (unpaid fees still owed)", "FF0E2A47");
      const total = ws.addRow({ student: "Total outstanding", period: `${unpaid.length} fee(s)`, amount: owed });
      total.font = { bold: true };
    }
  };

  // Per-student fee totals
  const feeByStudent = new Map<string, { total: number; paid: number; outstanding: number }>();
  for (const f of fees) {
    const acc = feeByStudent.get(f.studentId) ?? { total: 0, paid: 0, outstanding: 0 };
    acc.total += f.amount;
    if (f.status === "PAID") acc.paid += f.amount;
    else acc.outstanding += f.amount;
    feeByStudent.set(f.studentId, acc);
  }

  sheet(
    "Students",
    [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Active", key: "active", width: 8 },
      { header: "Enrolled Courses", key: "courses", width: 40 },
      { header: "Fees Total (PKR)", key: "total", width: 16 },
      { header: "Paid (PKR)", key: "paid", width: 14 },
      { header: "Outstanding (PKR)", key: "outstanding", width: 16 },
      { header: "Registered On", key: "createdAt", width: 16 },
    ],
    learners.map((l) => {
      const f = feeByStudent.get(l.id) ?? { total: 0, paid: 0, outstanding: 0 };
      return {
        name: l.name,
        email: l.email,
        phone: l.phone ?? "",
        active: l.active ? "Yes" : "No",
        courses: l.enrollments.map((e) => e.course.titleEn).join(", "),
        total: f.total,
        paid: f.paid,
        outstanding: f.outstanding,
        createdAt: fmtDate(l.createdAt),
      };
    }),
  );

  // Active (undeleted) fees — Paid / Due / Partially paid branches + Outstanding.
  feeSheet("Active Fees", fees, { outstanding: true });
  // Deleted fees — same 3 branches, kept so the teacher remembers a mistaken/removed charge.
  feeSheet("Deleted Fees", deletedFees, { deletedOn: true });

  sheet(
    "Courses",
    [
      { header: "Title (English)", key: "en", width: 30 },
      { header: "Title (Urdu)", key: "ur", width: 30 },
      { header: "Fee", key: "fee", width: 18 },
      { header: "Published", key: "published", width: 10 },
      { header: "Order", key: "order", width: 8 },
    ],
    courses.map((c) => ({ en: c.titleEn, ur: c.titleUr, fee: c.feeText, published: c.published ? "Yes" : "No", order: c.order })),
  );

  sheet(
    "Live Classes",
    [
      { header: "Course", key: "course", width: 26 },
      { header: "Title", key: "title", width: 30 },
      { header: "Starts", key: "starts", width: 20 },
      { header: "Duration (mins)", key: "duration", width: 14 },
      { header: "Has Link", key: "link", width: 10 },
    ],
    classes.map((c) => ({
      course: c.course.titleEn,
      title: c.title,
      starts: new Date(c.startsAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
      duration: c.durationMins,
      link: c.meetingLink ? "Yes" : "No",
    })),
  );

  sheet(
    "Recordings",
    [
      { header: "Course", key: "course", width: 26 },
      { header: "Title", key: "title", width: 30 },
      { header: "URL", key: "url", width: 44 },
      { header: "Recorded On", key: "on", width: 16 },
    ],
    recordings.map((r) => ({ course: r.course.titleEn, title: r.title, url: r.url, on: fmtDate(r.recordedOn) })),
  );

  sheet(
    "Registrations",
    [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Course", key: "course", width: 26 },
      { header: "Status", key: "status", width: 12 },
      { header: "Requested On", key: "on", width: 16 },
    ],
    registrations.map((r) => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      course: r.course?.titleEn ?? "Any course",
      status: r.status,
      on: fmtDate(r.createdAt),
    })),
  );

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="quindeel-data-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
