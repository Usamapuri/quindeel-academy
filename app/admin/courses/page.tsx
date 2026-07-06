import Link from "next/link";
import { prisma } from "@/lib/db";
import { addCourse, deleteCourse, toggleCoursePublished, moveCourse } from "@/app/actions/admin";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Courses</h1>
      <p className="text-slate-600">
        Add or remove courses here. To change a course&apos;s name, description or fee, open{" "}
        <Link href="/" className="font-semibold text-brand underline">your website</Link> and click the
        text to edit it (in both English and Urdu).
      </p>

      <form action={addCourse} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-4">
          <h2 className="font-semibold text-brand-dark">Add a course</h2>
        </div>
        <input name="titleEn" placeholder="Title (English)" required className={input} />
        <input name="titleUr" placeholder="Title (Urdu)" dir="rtl" className={input} />
        <input name="feeText" placeholder="Fee e.g. 15000/month" className={input} />
        <button className="btn btn-primary !py-2 text-sm">Add course</button>
      </form>

      <div className="space-y-3">
        {courses.map((c, i) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <form action={moveCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button disabled={i === 0} className="text-slate-400 hover:text-brand disabled:opacity-30">▲</button>
                </form>
                <form action={moveCourse}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button disabled={i === courses.length - 1} className="text-slate-400 hover:text-brand disabled:opacity-30">▼</button>
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
                  {c.published ? "Published" : "Hidden"}
                </button>
              </form>
              <form action={deleteCourse}>
                <input type="hidden" name="id" value={c.id} />
                <button className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
