import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";

const ICONS = ["📖", "✒️", "📝", "🎓", "🏫", "📚", "🏆", "👥"];
const UNIT_UR: Record<string, string> = {
  month: "ماہانہ",
  "Full Package": "مکمل پیکج",
  Head: "فی کس",
  group: "فی گروپ",
};

/** Split a free-text fee ("15000/month") into a polished amount + unit for display. */
function splitFee(feeText: string, ur: boolean) {
  const idx = feeText.indexOf("/");
  const amountRaw = (idx >= 0 ? feeText.slice(0, idx) : feeText).trim();
  const unitRaw = idx >= 0 ? feeText.slice(idx + 1).trim() : "";
  const digits = amountRaw.replace(/[^\d]/g, "");
  const amount = digits ? Number(digits).toLocaleString("en-US") : amountRaw;
  const unit = ur ? UNIT_UR[unitRaw] ?? unitRaw : unitRaw;
  return { amount, unit };
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-brand">
      <path d="m4 10 4 4 8-9" />
    </svg>
  );
}

export default async function FeesPage() {
  const lang = await getLang();
  const ur = lang === "ur";
  const suffix = ur ? "Ur" : "En";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";
  const s = await getSettings();

  const allCourses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  const field = (base: string) => `setting:${settingKey(base, lang)}`;
  const val = (base: string) => s[settingKey(base, lang)] || "";

  // Teacher workshops live in their own "For educators" section (real workshop courses only).
  const isWorkshop = (c: (typeof allCourses)[number]) =>
    /workshop|teacher/i.test(c.slug) || /workshop|teacher/i.test(c.titleEn);
  const courses = allCourses.filter((c) => !isWorkshop(c));
  const workshops = allCourses.filter(isWorkshop);

  const perks = [1, 2, 3]
    .map((n) => ({ n, text: val(`feePerk${n}`) }))
    .filter((p) => p.text);

  // A single fee card. `withPerks` shows the shared inclusions list (academic courses only).
  const FeeCard = ({ course, index, withPerks }: { course: (typeof allCourses)[number]; index: number; withPerks: boolean }) => {
    const { amount, unit } = splitFee(course.feeText, ur);
    return (
      <div className="card card-hover flex h-full flex-col p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-light text-2xl">
            {ICONS[index % ICONS.length]}
          </span>
          <Editable
            field={`course:${course.id}:title${suffix}`}
            value={ur ? course.titleUr : course.titleEn}
            as="h3"
            className="text-lg font-bold leading-snug text-brand-dark"
          />
        </div>

        {(ur ? course.summaryUr : course.summaryEn) && (
          <p className="mt-2 text-sm text-slate-500">{ur ? course.summaryUr : course.summaryEn}</p>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          {canEdit ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-brand">PKR</span>
              <Editable field={`course:${course.id}:feeText`} value={course.feeText} className="text-xl font-extrabold text-brand" />
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-slate-500">PKR</span>
              <span className="text-3xl font-extrabold text-brand-dark">{amount}</span>
              {unit && <span className="text-sm text-slate-500">/ {unit}</span>}
            </div>
          )}
        </div>

        {withPerks && perks.length > 0 && (
          <ul className="mt-4 flex-1 space-y-2.5 text-sm text-slate-600">
            {perks.map((p) => (
              <li key={p.n} className="flex gap-2">
                <Check />
                <Editable field={field(`feePerk${p.n}`)} value={p.text} />
              </li>
            ))}
          </ul>
        )}

        <Link href="/register" className="btn btn-outline mt-6 w-full">
          {ur ? "داخلہ لیں" : "Enroll now"} →
        </Link>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <Editable field={field("feeTitle")} value={val("feeTitle")} as="h1" className="text-center text-3xl font-bold text-brand-dark sm:text-4xl" />
      <Editable field={field("feeIntro")} value={val("feeIntro")} as="p" multiline className="mx-auto mt-3 max-w-2xl text-center text-slate-600" />

      {/* Course pricing cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => (
          <FeeCard key={c.id} course={c} index={i} withPerks />
        ))}
      </div>

      {/* For educators — teacher workshops (real workshop courses only) */}
      {workshops.length > 0 && (
        <div className="mt-16">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
            <span className="h-px w-6 bg-brand" />
            {ur ? "اساتذہ کے لیے" : "For educators"}
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            {ur ? "اساتذہ ورکشاپ فیس" : "Teacher Workshop Fees"}
          </h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2">
            {workshops.map((c, i) => (
              <FeeCard key={c.id} course={c} index={courses.length + i} withPerks={false} />
            ))}
          </div>
        </div>
      )}

      {/* Important notes (seeded from the academy's real policies; editable) */}
      <div className="mt-14 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-900">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-200 text-sm text-amber-800">i</span>
          {ur ? "اہم نکات" : "Important Notes"}
        </h2>
        <ul className="space-y-3 text-slate-700">
          <li className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <Editable field={field("policy1")} value={val("policy1")} multiline />
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <Editable field={field("policy2")} value={val("policy2")} multiline />
          </li>
        </ul>
      </div>

      {/* Enroll CTA — wired to the real native /register + real contact details */}
      <div className="card mt-14 px-6 py-12 text-center sm:px-10">
        <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
          {ur ? "داخلے کے لیے تیار ہیں؟" : "Ready to enroll?"}
        </h2>
        <Editable field={field("registerIntro")} value={val("registerIntro")} as="p" multiline className="mx-auto mt-3 max-w-2xl text-slate-600" />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn btn-primary">
            {t(lang, "common.registerNow")}
          </Link>
          {s.whatsapp && (
            <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
