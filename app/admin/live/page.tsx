import Link from "next/link";
import { prisma } from "@/lib/db";
import { isGoogleConnected } from "@/lib/google";
import { createClass, deleteClass } from "@/app/actions/live";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function LivePage() {
  const [courses, classes, connected] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.classSession.findMany({ orderBy: { startsAt: "desc" }, include: { course: true } }),
    isGoogleConnected(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-brand-dark">Live Classes</h1>
        <span
          className={
            "rounded-full px-3 py-1 text-sm font-semibold " +
            (connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")
          }
        >
          {connected ? "🔗 Google connected — Meet links auto-created" : "Google not connected — paste a link manually"}
        </span>
      </div>

      {!connected && (
        <p className="text-sm text-slate-500">
          Tip: connect your Google account on the{" "}
          <Link href="/admin/google" className="font-semibold text-brand underline">Google page</Link>{" "}
          to create Meet links automatically. Until then, paste a meeting link below.
        </p>
      )}

      <form action={createClass} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-semibold text-brand-dark">Schedule a live class</h2>
        </div>
        <select name="courseId" required className={input}>
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.titleEn}</option>
          ))}
        </select>
        <input name="title" placeholder="Class title" required className={input} />
        <input name="startsAt" type="datetime-local" required className={input} />
        <input name="durationMins" type="number" defaultValue={60} placeholder="Duration (mins)" className={input} />
        <input name="descriptionEn" placeholder="Description (English)" className={input} />
        <input name="descriptionUr" placeholder="Description (Urdu)" dir="rtl" className={input} />
        <input
          name="meetingLink"
          placeholder={connected ? "Meeting link (leave blank to auto-create)" : "Paste Google Meet / Zoom link"}
          className={`${input} sm:col-span-2`}
        />
        <div className="sm:col-span-2">
          <button className="btn btn-primary !py-2 text-sm">Create class</button>
        </div>
      </form>

      <div className="space-y-3">
        {classes.length === 0 && <p className="text-slate-500">No classes scheduled yet.</p>}
        {classes.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-brand-dark">{c.title}</p>
              <p className="text-sm text-slate-500">{c.course.titleEn} · {fmt(c.startsAt)} · {c.durationMins} min</p>
            </div>
            <div className="flex items-center gap-2">
              {c.meetingLink ? (
                <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
                  Meet link
                </a>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">No link</span>
              )}
              <form action={deleteClass}>
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
