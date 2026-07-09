import Link from "next/link";
import { prisma } from "@/lib/db";
import { addCourse, deleteCourse, toggleCoursePublished, moveCourse } from "@/app/actions/admin";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import { getLang } from "@/lib/lang";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; published?: string; sort?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const publishedFilter = sp.published ?? "";
  const sort = sp.sort ?? "";

  const allCourses = await prisma.course.findMany({ orderBy: { order: "asc" } });
  // First/last by manual order — drives the ▲/▼ reorder buttons regardless of
  // the current filter/sort, so moving a course always swaps the right neighbour.
  const firstId = allCourses[0]?.id;
  const lastId = allCourses[allCourses.length - 1]?.id;

  const courses = allCourses
    .filter((c) => !q || c.titleEn.toLowerCase().includes(q) || c.titleUr.toLowerCase().includes(q))
    .filter((c) => !publishedFilter || String(c.published) === publishedFilter)
    .sort((a, b) => {
      switch (sort) {
        case "title":
          return a.titleEn.localeCompare(b.titleEn);
        case "title_desc":
          return b.titleEn.localeCompare(a.titleEn);
        default:
          return a.order - b.order; // manual order
      }
    });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">{ur ? "کورسز" : "Courses"}</h1>
      <p className="text-slate-600">
        {ur ? "یہاں کورسز شامل یا حذف کریں۔ کسی کورس کا نام، تفصیل یا فیس تبدیل کرنے کے لیے " : "Add or remove courses here. To change a course's name, description or fee, open "}
        <Link href="/" className="font-semibold text-brand underline">{ur ? "اپنی ویب سائٹ" : "your website"}</Link>
        {ur ? " کھولیں اور متن پر کلک کر کے ترمیم کریں (انگریزی اور اردو دونوں میں)۔" : " and click the text to edit it (in both English and Urdu)."}
      </p>

      <form action={addCourse} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-4">
          <h2 className="font-semibold text-brand-dark">{ur ? "کورس شامل کریں" : "Add a course"}</h2>
        </div>
        <input name="titleEn" placeholder={ur ? "عنوان (انگریزی)" : "Title (English)"} required className={input} />
        <input name="titleUr" placeholder={ur ? "عنوان (اردو)" : "Title (Urdu)"} dir="rtl" className={input} />
        <input name="feeText" placeholder={ur ? "فیس مثلاً 15000/ماہ" : "Fee e.g. 15000/month"} className={input} />
        <button className="btn btn-primary !py-2 text-sm">{ur ? "کورس شامل کریں" : "Add course"}</button>
      </form>

      <AdminFilterBar
        basePath="/admin/courses"
        current={sp}
        search={{ name: "q", placeholder: ur ? "نام سے تلاش کریں" : "Search by name" }}
        selects={[
          {
            name: "published",
            label: ur ? "تمام کورسز" : "All courses",
            options: [
              { value: "true", label: ur ? "شائع شدہ" : "Published" },
              { value: "false", label: ur ? "پوشیدہ" : "Hidden" },
            ],
          },
        ]}
        sort={{
          name: "sort",
          options: [
            { value: "", label: ur ? "دستی ترتیب" : "Manual order" },
            { value: "title", label: ur ? "عنوان: الف سے ے" : "Title A–Z" },
            { value: "title_desc", label: ur ? "عنوان: ے سے الف" : "Title Z–A" },
          ],
        }}
      />

      <div className="space-y-3">
        {courses.length === 0 && (
          <p className="text-slate-500">
            {allCourses.length === 0
              ? ur ? "ابھی کوئی کورس نہیں۔" : "No courses yet."
              : ur ? "فلٹر سے کوئی کورس نہیں ملا۔" : "No courses match the filter."}
          </p>
        )}
        {courses.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <form action={moveCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button disabled={c.id === firstId} className="text-slate-400 hover:text-brand disabled:opacity-30">▲</button>
                </form>
                <form action={moveCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button disabled={c.id === lastId} className="text-slate-400 hover:text-brand disabled:opacity-30">▼</button>
                </form>
              </div>
              <div>
                <p className="font-bold text-brand-dark">{c.titleEn}</p>
                <p className="text-sm text-slate-500" dir="rtl">{c.titleUr} · {c.feeText}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleCoursePublished}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="published" value={String(c.published)} />
                <button
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold " +
                    (c.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")
                  }
                >
                  {c.published ? (ur ? "شائع شدہ" : "Published") : (ur ? "پوشیدہ" : "Hidden")}
                </button>
              </form>
              <ConfirmDeleteButton
                action={deleteCourse}
                fields={{ id: c.id }}
                message={
                  ur
                    ? `کورس "${c.titleEn}" حذف کریں؟\n\nاس سے اس کی لائیو کلاسز، ریکارڈنگز اور اندراج بھی حذف ہو جائیں گے۔ یہ عمل واپس نہیں ہو سکتا۔`
                    : `Delete the course "${c.titleEn}"?\n\nThis also removes its live classes, recordings and enrollments. This cannot be undone.`
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
