import { prisma } from "@/lib/db";
import { addRecording, deleteRecording } from "@/app/actions/admin";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default async function RecordingsPage() {
  const [courses, recordings] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.recording.findMany({ orderBy: { createdAt: "desc" }, include: { course: true } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Recorded Lectures</h1>

      <form action={addRecording} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-semibold text-brand-dark">Add a recording</h2>
          <p className="text-sm text-slate-500">Paste a YouTube or Google Drive link. Only enrolled learners can see it.</p>
        </div>
        <select name="courseId" required className={input}>
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.titleEn}</option>
          ))}
        </select>
        <input name="title" placeholder="Lecture title" required className={input} />
        <input name="url" type="url" placeholder="https://…" required className={`${input} sm:col-span-2`} />
        <input name="descriptionEn" placeholder="Description (English)" className={input} />
        <input name="descriptionUr" placeholder="Description (Urdu)" dir="rtl" className={input} />
        <div className="sm:col-span-2">
          <button className="btn btn-primary !py-2 text-sm">Add recording</button>
        </div>
      </form>

      <div className="space-y-3">
        {recordings.length === 0 && <p className="text-slate-500">No recordings yet.</p>}
        {recordings.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-brand-dark">{r.title}</p>
              <p className="text-sm text-slate-500">{r.course.titleEn}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
                Open
              </a>
              <form action={deleteRecording}>
                <input type="hidden" name="id" value={r.id} />
                <button className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
