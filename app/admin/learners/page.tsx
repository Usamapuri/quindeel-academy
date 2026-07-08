import { prisma } from "@/lib/db";
import {
  createLearner,
  resetLearnerPassword,
  toggleLearnerActive,
  setEnrollment,
  deleteLearner,
} from "@/app/actions/admin";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import AdminFilterBar from "@/components/AdminFilterBar";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const courseFilter = sp.course ?? "";
  const sort = sp.sort ?? "";

  const [allLearners, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { enrollments: true },
    }),
    prisma.course.findMany({ orderBy: { order: "asc" } }),
  ]);

  const learners = allLearners
    .filter((l) => !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q))
    .filter((l) => !courseFilter || l.enrollments.some((e) => e.courseId === courseFilter))
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "oldest":
          return +a.createdAt - +b.createdAt;
        default:
          return +b.createdAt - +a.createdAt; // newest
      }
    });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Learners</h1>

      {/* Add learner */}
      <form action={createLearner} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-4">
          <h2 className="font-semibold text-brand-dark">Add a new learner</h2>
        </div>
        <input name="name" placeholder="Full name" required className={input} />
        <input name="email" type="email" placeholder="Email (login)" required className={input} />
        <input name="phone" placeholder="Phone" className={input} />
        <input name="password" placeholder="Set a password" required className={input} />
        <div className="lg:col-span-4">
          <button className="btn btn-primary !py-2 text-sm">Add learner</button>
        </div>
      </form>

      {/* Filter + sort */}
      <AdminFilterBar
        basePath="/admin/learners"
        current={sp}
        search={{ name: "q", placeholder: "Search by name / email" }}
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
            { value: "name", label: "Name A–Z" },
            { value: "name_desc", label: "Name Z–A" },
          ],
        }}
      />

      {/* List */}
      <div className="space-y-4">
        {learners.length === 0 && (
          <p className="text-slate-500">
            {allLearners.length === 0 ? "No learners yet." : "No learners match the filter."}
          </p>
        )}
        {learners.map((l) => {
          const enrolled = new Set(l.enrollments.map((e) => e.courseId));
          return (
            <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-brand-dark">
                    {l.name}{" "}
                    {!l.active && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Inactive</span>}
                  </p>
                  <p className="text-sm text-slate-500">{l.email}{l.phone ? ` · ${l.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleLearnerActive}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="active" value={String(l.active)} />
                    <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      {l.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <ConfirmDeleteButton
                    action={deleteLearner}
                    fields={{ id: l.id }}
                    message={`Permanently delete ${l.name}?\n\nThis removes their login, course enrollments and fee records. This cannot be undone.`}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  />
                </div>
              </div>

              {/* Enrollments (collapsed by default to save space) */}
              <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Courses</span>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      {enrolled.size} enrolled
                    </span>
                  </span>
                  <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
                  {courses.map((c) => {
                    const isOn = enrolled.has(c.id);
                    return (
                      <form action={setEnrollment} key={c.id}>
                        <input type="hidden" name="studentId" value={l.id} />
                        <input type="hidden" name="courseId" value={c.id} />
                        <input type="hidden" name="enroll" value={String(!isOn)} />
                        <button
                          className={
                            "rounded-full px-3 py-1 text-xs font-semibold transition " +
                            (isOn ? "bg-brand text-white" : "border border-slate-300 text-slate-500 hover:bg-slate-100")
                          }
                        >
                          {isOn ? "✓ " : "+ "}
                          {c.titleEn}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </details>

              {/* Reset password */}
              <form action={resetLearnerPassword} className="mt-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={l.id} />
                <input name="password" placeholder="New password" className={`${input} max-w-xs`} />
                <button className="rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light">
                  Reset password
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
