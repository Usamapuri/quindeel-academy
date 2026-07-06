import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { t, pick, type Lang } from "@/lib/i18n";

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

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold text-brand-dark">{title}</h2>
      {children}
    </section>
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

      {/* Fees */}
      <Section title={t(lang, "portal.fees")}>
        {fees.length === 0 ? (
          <p className="text-slate-500">{t(lang, "portal.noFees")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-medium text-brand-dark">{f.period}</td>
                    <td className="px-4 py-3 text-slate-600">{f.course ? pick(lang, f.course.titleEn, f.course.titleUr) : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{f.amount ? `${f.amount.toLocaleString()} PKR` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (FEE_STYLE[f.status] || "")}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
