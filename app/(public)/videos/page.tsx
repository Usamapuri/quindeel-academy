import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { pick, t } from "@/lib/i18n";
import { VideoCard } from "@/components/VideoCard";
import { VideoDescription } from "@/components/VideoDescription";
import { AddVideoForm } from "@/components/AddVideoForm";
import AdminFilterBar from "@/components/AdminFilterBar";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { deleteVideo, toggleVideoCourse } from "@/app/actions/video";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const sort = sp.sort ?? "";

  const [allVideos, courses] = await Promise.all([
    prisma.video.findMany({ orderBy: { createdAt: "desc" }, include: { courses: true } }),
    prisma.course.findMany({ orderBy: { order: "asc" } }),
  ]);

  // Which courses this viewer may see lectures for.
  let enrolled = new Set<string>();
  if (session?.role === "STUDENT") {
    const e = await prisma.enrollment.findMany({ where: { studentId: session.sub }, select: { courseId: true } });
    enrolled = new Set(e.map((x) => x.courseId));
  }
  const canSeeCourse = (cid: string) => canEdit || enrolled.has(cid);
  const courseOpts = courses.map((c) => ({ id: c.id, title: pick(lang, c.titleEn, c.titleUr) }));

  const matches = (v: (typeof allVideos)[number]) =>
    !q || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
  const bySort = (a: (typeof allVideos)[number], b: (typeof allVideos)[number]) => {
    switch (sort) {
      case "oldest":
        return +a.createdAt - +b.createdAt;
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return +b.createdAt - +a.createdAt;
    }
  };

  const publicVideos = allVideos.filter((v) => v.courses.length === 0 && matches(v)).sort(bySort);
  const lectureCourses = courses
    .map((c) => ({ course: c, items: allVideos.filter((v) => v.courses.some((x) => x.id === c.id) && matches(v)).sort(bySort) }))
    .filter((g) => g.items.length > 0);
  const anyLecturesExist = allVideos.some((v) => v.courses.length > 0);

  const card = (v: (typeof allVideos)[number]) => (
    <div key={v.id} className="relative min-w-0">
      <VideoCard videoId={v.videoId} title={v.title} />
      {canEdit && (
        <div className="absolute right-2 top-2">
          <ConfirmDeleteButton
            action={deleteVideo}
            fields={{ id: v.id }}
            message={ur ? "یہ ویڈیو ہٹا دیں؟" : "Remove this video?"}
            className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-red-600"
          >
            ✕
          </ConfirmDeleteButton>
        </div>
      )}
      <VideoDescription videoId={v.id} description={v.description} lang={lang} />
      {canEdit && (
        <details className="group mt-2 rounded-lg border border-slate-200 bg-slate-50/60 text-xs">
          <summary className="cursor-pointer list-none px-3 py-1.5 font-semibold text-slate-600">
            {v.courses.length === 0
              ? ur ? "عوامی — کورسز تفویض کرنے کے لیے کلک کریں" : "Public — tap to assign courses"
              : `${ur ? "لیکچر:" : "Lecture in:"} ${v.courses.map((c) => pick(lang, c.titleEn, c.titleUr)).join(ur ? "، " : ", ")}`}
          </summary>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-200 px-3 py-2">
            {courses.map((c) => {
              const on = v.courses.some((x) => x.id === c.id);
              return (
                <form key={c.id} action={toggleVideoCourse}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="courseId" value={c.id} />
                  <input type="hidden" name="on" value={String(!on)} />
                  <button
                    className={
                      "rounded-full px-2 py-0.5 font-semibold transition " +
                      (on ? "bg-brand text-white" : "border border-slate-300 text-slate-500 hover:bg-slate-100")
                    }
                  >
                    {on ? "✓ " : "+ "}
                    {pick(lang, c.titleEn, c.titleUr)}
                  </button>
                </form>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );

  const grid = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "ویڈیوز" : "Videos"}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">{ur ? "ہماری ویڈیوز اور لیکچرز دیکھیں۔" : "Watch our videos and lectures."}</p>

      {canEdit && (
        <div className="mb-6">
          <AddVideoForm lang={lang} courses={courseOpts} />
        </div>
      )}

      {allVideos.length > 0 && (
        <div className="mb-8">
          <AdminFilterBar
            basePath="/videos"
            current={sp}
            search={{ name: "q", placeholder: ur ? "ویڈیوز تلاش کریں…" : "Search videos…" }}
            sort={{
              name: "sort",
              options: [
                { value: "", label: ur ? "تازہ ترین" : "Newest" },
                { value: "oldest", label: ur ? "قدیم ترین" : "Oldest" },
                { value: "title", label: ur ? "عنوان: الف سے ے" : "Title A–Z" },
                { value: "title_desc", label: ur ? "عنوان: ے سے الف" : "Title Z–A" },
              ],
            }}
          />
        </div>
      )}

      {/* ---- Public videos: everyone ---- */}
      <div className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-brand-dark">{ur ? "عوامی ویڈیوز" : "Public videos"}</h2>
        {publicVideos.length === 0 ? (
          <p className="text-slate-500">{ur ? "ابھی کوئی عوامی ویڈیو نہیں۔" : "No public videos yet."}</p>
        ) : (
          <div className={grid}>{publicVideos.map(card)}</div>
        )}
      </div>

      {/* ---- Course lecture notes: logged-in + enrolled only ---- */}
      <div>
        <h2 className="mb-1 text-xl font-bold text-brand-dark">
          🔒 {ur ? "لیکچر نوٹس (کورس کے مطابق)" : "Lecture notes (by course)"}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {ur ? "صرف اپنے کورس میں اندراج شدہ لاگ اِن طلبہ کے لیے۔" : "For logged-in students enrolled in the course."}
        </p>

        {!session && anyLecturesExist && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-slate-600">{ur ? "لیکچر نوٹس دیکھنے کے لیے لاگ اِن کریں۔" : "Log in to access your course lecture notes."}</p>
            <Link href="/login" className="btn btn-primary mt-3">{t(lang, "nav.login")}</Link>
          </div>
        )}

        {lectureCourses.filter((g) => canSeeCourse(g.course.id)).map((g) => (
          <div key={g.course.id} className="mb-10">
            <h3 className="mb-3 font-bold text-brand">
              {pick(lang, g.course.titleEn, g.course.titleUr)}
              {canEdit && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{ur ? "اندراج شدہ طلبہ" : "enrolled only"}</span>}
            </h3>
            <div className={grid}>{g.items.map(card)}</div>
          </div>
        ))}

        {session && !canEdit && lectureCourses.filter((g) => canSeeCourse(g.course.id)).length === 0 && (
          <p className="text-slate-500">
            {anyLecturesExist
              ? ur ? "آپ کے اندراج شدہ کورسز کے لیے کوئی لیکچر دستیاب نہیں۔" : "No lecture notes available for your enrolled courses yet."
              : ur ? "ابھی کوئی لیکچر نوٹس نہیں۔" : "No lecture notes yet."}
          </p>
        )}
      </div>
    </section>
  );
}
