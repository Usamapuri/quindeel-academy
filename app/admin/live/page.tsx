import Link from "next/link";
import { prisma } from "@/lib/db";
import { isGoogleConnected } from "@/lib/google";
import { createClass, deleteClass } from "@/app/actions/live";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import { getLang } from "@/lib/lang";
import { pick, type Lang } from "@/lib/i18n";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function fmt(d: Date, lang: Lang) {
  return new Date(d).toLocaleString(lang === "ur" ? "ur-PK" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; sort?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const courseFilter = sp.course ?? "";
  const sort = sp.sort ?? "";

  const [courses, allClasses, connected] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.classSession.findMany({ orderBy: { startsAt: "desc" }, include: { course: true } }),
    isGoogleConnected(),
  ]);

  const classes = allClasses
    .filter((c) => !q || c.title.toLowerCase().includes(q))
    .filter((c) => !courseFilter || c.courseId === courseFilter)
    .sort((a, b) => {
      switch (sort) {
        case "soonest":
          return +a.startsAt - +b.startsAt;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return +b.startsAt - +a.startsAt; // latest first
      }
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-brand-dark">{ur ? "لائیو کلاسز" : "Live Classes"}</h1>
        <span
          className={
            "rounded-full px-3 py-1 text-sm font-semibold " +
            (connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")
          }
        >
          {connected
            ? ur ? "🔗 گوگل منسلک — میٹ لنکس خودبخود بنتے ہیں" : "🔗 Google connected — Meet links auto-created"
            : ur ? "گوگل منسلک نہیں — لنک خود پیسٹ کریں" : "Google not connected — paste a link manually"}
        </span>
      </div>

      {!connected && (
        <p className="text-sm text-slate-500">
          {ur ? "مشورہ: " : "Tip: connect your Google account on the "}
          <Link href="/admin/google" className="font-semibold text-brand underline">{ur ? "گوگل صفحہ" : "Google page"}</Link>
          {ur
            ? " پر اپنا گوگل اکاؤنٹ منسلک کریں تاکہ میٹ لنکس خودبخود بن جائیں۔ تب تک، نیچے میٹنگ لنک پیسٹ کریں۔"
            : " to create Meet links automatically. Until then, paste a meeting link below."}
        </p>
      )}

      <form action={createClass} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-semibold text-brand-dark">{ur ? "لائیو کلاس شیڈول کریں" : "Schedule a live class"}</h2>
        </div>
        <select name="courseId" required className={input}>
          <option value="">{ur ? "کورس منتخب کریں" : "Select course"}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{pick(lang, c.titleEn, c.titleUr)}</option>
          ))}
        </select>
        <input name="title" placeholder={ur ? "کلاس کا عنوان" : "Class title"} required className={input} />
        <input name="startsAt" type="datetime-local" required className={input} />
        <input name="durationMins" type="number" defaultValue={60} placeholder={ur ? "دورانیہ (منٹ)" : "Duration (mins)"} className={input} />
        <input name="descriptionEn" placeholder={ur ? "تفصیل (انگریزی)" : "Description (English)"} className={input} />
        <input name="descriptionUr" placeholder={ur ? "تفصیل (اردو)" : "Description (Urdu)"} dir="rtl" className={input} />
        <input
          name="meetingLink"
          type="url"
          required={!connected}
          pattern="https?://.+"
          title={ur ? "براہ کرم مکمل لنک درج کریں (https:// سے شروع)" : "Please enter a full link starting with https://"}
          placeholder={connected ? (ur ? "میٹنگ لنک (خودکار کے لیے خالی چھوڑیں)" : "Meeting link (leave blank to auto-create)") : (ur ? "https:// گوگل میٹ / زوم لنک (لازمی)" : "https://… Google Meet / Zoom link (required)")}
          className={`${input} sm:col-span-2`}
        />
        <div className="sm:col-span-2">
          <button className="btn btn-primary !py-2 text-sm">{ur ? "کلاس بنائیں" : "Create class"}</button>
        </div>
      </form>

      <AdminFilterBar
        basePath="/admin/live"
        current={sp}
        search={{ name: "q", placeholder: ur ? "کلاس کے عنوان سے تلاش کریں" : "Search by class title" }}
        selects={[
          {
            name: "course",
            label: ur ? "تمام کورسز" : "All courses",
            options: courses.map((c) => ({ value: c.id, label: pick(lang, c.titleEn, c.titleUr) })),
          },
        ]}
        sort={{
          name: "sort",
          options: [
            { value: "", label: ur ? "تازہ ترین پہلے" : "Latest first" },
            { value: "soonest", label: ur ? "جلد ترین پہلے" : "Soonest first" },
            { value: "title", label: ur ? "عنوان: الف سے ے" : "Title A–Z" },
          ],
        }}
      />

      <div className="space-y-3">
        {classes.length === 0 && (
          <p className="text-slate-500">
            {allClasses.length === 0
              ? ur ? "ابھی کوئی کلاس شیڈول نہیں۔" : "No classes scheduled yet."
              : ur ? "فلٹر سے کوئی کلاس نہیں ملی۔" : "No classes match the filter."}
          </p>
        )}
        {classes.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-brand-dark">{c.title}</p>
              <p className="text-sm text-slate-500">{pick(lang, c.course.titleEn, c.course.titleUr)} · {fmt(c.startsAt, lang)} · {c.durationMins} {ur ? "منٹ" : "min"}</p>
            </div>
            <div className="flex items-center gap-2">
              {c.meetingLink ? (
                <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
                  {ur ? "میٹ لنک" : "Meet link"}
                </a>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{ur ? "کوئی لنک نہیں" : "No link"}</span>
              )}
              <ConfirmDeleteButton
                action={deleteClass}
                fields={{ id: c.id }}
                message={ur ? `کلاس "${c.title}" حذف کریں؟\n\nیہ عمل واپس نہیں ہو سکتا۔` : `Delete the class "${c.title}"?\n\nThis cannot be undone.`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
