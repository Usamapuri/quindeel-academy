import { prisma } from "@/lib/db";
import { addRecording, deleteRecording } from "@/app/actions/admin";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import AdminFilterBar from "@/components/AdminFilterBar";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default async function RecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const courseFilter = sp.course ?? "";
  const sort = sp.sort ?? "";

  const [courses, allRecordings] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.recording.findMany({ orderBy: { createdAt: "desc" }, include: { course: true } }),
  ]);

  const recordings = allRecordings
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .filter((r) => !courseFilter || r.courseId === courseFilter)
    .sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);
        case "course":
          return a.course.titleEn.localeCompare(b.course.titleEn);
        case "oldest":
          return +a.createdAt - +b.createdAt;
        default:
          return +b.createdAt - +a.createdAt; // newest
      }
    });

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

      <AdminFilterBar
        basePath="/admin/recordings"
        current={sp}
        search={{ name: "q", placeholder: "Search by title" }}
        selects={[
          {
            name: "course",
            label: "All courses",
            options: courses.map((c) => ({ value: c.id, label: c.titleEn })),
          },
        ]}
        sort={{
          name: "sort",
          options: [
            { value: "", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "title", label: "Title A–Z" },
            { value: "course", label: "Course A–Z" },
          ],
        }}
      />

      <div className="space-y-3">
        {recordings.length === 0 && (
          <p className="text-slate-500">
            {allRecordings.length === 0 ? "No recordings yet." : "No recordings match the filter."}
          </p>
        )}
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
              <ConfirmDeleteButton
                action={deleteRecording}
                fields={{ id: r.id }}
                message={`Delete the recording "${r.title}"?\n\nThis cannot be undone.`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
