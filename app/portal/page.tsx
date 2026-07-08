import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { t, pick, type Lang } from "@/lib/i18n";
import { requestCourses } from "@/app/actions/portal";

function fmt(d: Date, lang: Lang) {
  return new Date(d).toLocaleString(lang === "ur" ? "ur-PK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const FEE_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  DUE: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
};

export default async function PortalHome() {
  const session = await getSession();
  const lang = await getLang();
  const studentId = session!.sub;
  const studentEmail = session!.email.toLowerCase();

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  // Published courses the student can request, and their own registration
  // requests (to show pending / not-approved status and avoid offering dupes).
  const [allCourses, myRequests] = await Promise.all([
    prisma.course.findMany({ where: { published: true }, orderBy: { order: "asc" } }),
    prisma.registrationRequest.findMany({
      where: { email: studentEmail },
      orderBy: { createdAt: "desc" },
      include: { course: true },
    }),
  ]);
  const enrolledSet = new Set(courseIds);
  const pendingRequests = myRequests.filter((r) => r.status === "NEW");
  const rejectedRequests = myRequests.filter(
    (r) => r.status === "REJECTED" && r.courseId && !enrolledSet.has(r.courseId),
  );
  const pendingCourseIds = new Set(pendingRequests.map((r) => r.courseId).filter(Boolean));
  const requestableCourses = allCourses.filter(
    (c) => !enrolledSet.has(c.id) && !pendingCourseIds.has(c.id),
  );

  const [classes, recordings, fees] = await Promise.all([
    courseIds.length
      ? prisma.classSession.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { startsAt: "asc" },
          include: { course: true },
        })
      : Promise.resolve([]),
    courseIds.length
      ? prisma.recording.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { createdAt: "desc" },
          include: { course: true },
        })
      : Promise.resolve([]),
    prisma.feeRecord.findMany({
      where: { studentId },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
      include: { course: true },
    }),
  ]);

  const now = Date.now();
  const upcoming = classes.filter((c) => new Date(c.startsAt).getTime() >= now - 30 * 60000);

  const paidFees = fees.filter((f) => f.status === "PAID");
  const dueFees = fees.filter((f) => f.status === "DUE");
  const partialFees = fees.filter((f) => f.status === "PARTIAL");

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold text-brand-dark">{title}</h2>
      {children}
    </section>
  );

  const FeeDropdown = ({
    label,
    items,
    badgeClass,
  }: {
    label: string;
    items: typeof fees;
    badgeClass: string;
  }) => (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50">
        <span className="flex items-center gap-2 font-semibold text-brand-dark">
          {label}
          <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + badgeClass}>
            {items.length}
          </span>
        </span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-slate-100">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-400">{lang === "ur" ? "کچھ نہیں" : "None"}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {items.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 font-medium text-brand-dark">{f.period}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.course ? pick(lang, f.course.titleEn, f.course.titleUr) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.amount ? `${f.amount.toLocaleString()} PKR` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (FEE_STYLE[f.status] || "")}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-dark">
        {lang === "ur" ? `خوش آمدید، ${session!.name}` : `Welcome, ${session!.name}`}
      </h1>

      {/* My courses */}
      <Section title={t(lang, "portal.myCourses")}>
        {enrollments.length === 0 ? (
          <p className="text-slate-500">{lang === "ur" ? "ابھی کوئی کورس تفویض نہیں ہوا۔" : "No courses assigned yet."}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {enrollments.map((e) => (
              <span key={e.id} className="rounded-full bg-brand-light px-4 py-1.5 font-semibold text-brand">
                {pick(lang, e.course.titleEn, e.course.titleUr)}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Request more courses — one click, no re-entering details */}
      <Section title={lang === "ur" ? "مزید کورسز کی درخواست" : "Request more courses"}>
        {(pendingRequests.length > 0 || rejectedRequests.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingRequests.map((r) => (
              <span
                key={r.id}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
              >
                {r.course ? pick(lang, r.course.titleEn, r.course.titleUr) : "—"} ·{" "}
                {lang === "ur" ? "زیرِ التوا" : "Pending"}
              </span>
            ))}
            {rejectedRequests.map((r) => (
              <span
                key={r.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
              >
                {r.course ? pick(lang, r.course.titleEn, r.course.titleUr) : "—"} ·{" "}
                {lang === "ur" ? "منظور نہیں ہوا" : "Not approved"}
              </span>
            ))}
          </div>
        )}

        {requestableCourses.length === 0 ? (
          <p className="text-slate-500">
            {lang === "ur"
              ? "درخواست کے لیے فی الحال کوئی نیا کورس دستیاب نہیں۔"
              : "No more courses available to request right now."}
          </p>
        ) : (
          <form action={requestCourses} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm text-slate-600">
              {lang === "ur"
                ? "جن کورسز میں شامل ہونا چاہتے ہیں منتخب کریں، پھر درخواست بھیجیں۔"
                : "Select the courses you'd like to join, then send your request."}
            </p>
            <div className="flex flex-wrap gap-2">
              {requestableCourses.map((c) => (
                <label key={c.id} className="cursor-pointer select-none">
                  <input type="checkbox" name="courseId" value={c.id} className="peer sr-only" />
                  <span className="inline-block rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-500 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                    {pick(lang, c.titleEn, c.titleUr)}
                  </span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary mt-4 !py-2 text-sm">
              {lang === "ur" ? "درخواست بھیجیں" : "Send request"}
            </button>
          </form>
        )}
      </Section>

      {/* Live classes */}
      <Section title={t(lang, "portal.liveClasses")}>
        {upcoming.length === 0 ? (
          <p className="text-slate-500">{t(lang, "portal.noLive")}</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="font-bold text-brand-dark">{c.title}</p>
                  <p className="text-sm text-slate-500">
                    {pick(lang, c.course.titleEn, c.course.titleUr)} · {fmt(c.startsAt, lang)}
                  </p>
                  {(c.descriptionEn || c.descriptionUr) && (
                    <p className="mt-1 text-sm text-slate-600">{pick(lang, c.descriptionEn, c.descriptionUr)}</p>
                  )}
                </div>
                {c.meetingLink && (
                  <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary !py-2 text-sm">
                    {t(lang, "common.join")}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recorded lectures */}
      <Section title={t(lang, "portal.recordings")}>
        {recordings.length === 0 ? (
          <p className="text-slate-500">{t(lang, "portal.noRecordings")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recordings.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-brand-dark">{r.title}</p>
                  <p className="text-sm text-slate-500">{pick(lang, r.course.titleEn, r.course.titleUr)}</p>
                </div>
                <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand">▶ {t(lang, "common.watch")}</span>
              </a>
            ))}
          </div>
        )}
      </Section>

      {/* Fees — separated into Paid / Due / Partial dropdowns */}
      <Section title={t(lang, "portal.fees")}>
        {fees.length === 0 ? (
          <p className="text-slate-500">{t(lang, "portal.noFees")}</p>
        ) : (
          <div className="space-y-3">
            <FeeDropdown
              label={lang === "ur" ? "ادا شدہ" : "Paid"}
              items={paidFees}
              badgeClass="bg-emerald-100 text-emerald-700"
            />
            <FeeDropdown
              label={lang === "ur" ? "واجب الادا" : "Due"}
              items={dueFees}
              badgeClass="bg-red-100 text-red-700"
            />
            <FeeDropdown
              label={lang === "ur" ? "جزوی ادا شدہ" : "Partially paid"}
              items={partialFees}
              badgeClass="bg-amber-100 text-amber-700"
            />
          </div>
        )}
      </Section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm font-semibold text-brand hover:text-brand-dark">
          {lang === "ur" ? "ویب سائٹ دیکھیں" : "View website"} →
        </Link>
      </div>
    </div>
  );
}
