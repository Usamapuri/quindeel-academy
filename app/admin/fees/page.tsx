import { prisma } from "@/lib/db";
import { addFeeRecord, setFeeStatus, deleteFeeRecord } from "@/app/actions/admin";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  DUE: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
};

export default async function FeesPage() {
  const [students, courses, records] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.feeRecord.findMany({
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
      include: { student: true, course: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Fee Records</h1>

      <form action={addFeeRecord} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-6">
          <h2 className="font-semibold text-brand-dark">Record a fee</h2>
        </div>
        <select name="studentId" required className={`${input} lg:col-span-2`}>
          <option value="">Select learner</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select name="courseId" className={input}>
          <option value="">Course (optional)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.titleEn}</option>
          ))}
        </select>
        <input name="period" placeholder="Period e.g. 2026-08" required className={input} />
        <input name="amount" type="number" placeholder="Amount" className={input} />
        <select name="status" className={input}>
          <option value="DUE">Due</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <input name="note" placeholder="Note (optional)" className={`${input} lg:col-span-5`} />
        <button className="btn btn-primary !py-2 text-sm lg:col-span-1">Add</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No fee records yet.</td></tr>
            )}
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-brand-dark">{r.student.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.course?.titleEn || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.period}</td>
                <td className="px-4 py-3 text-slate-600">{r.amount ? `${r.amount.toLocaleString()} PKR` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATUS_STYLE[r.status] || "")}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.status !== "PAID" && (
                      <form action={setFeeStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="PAID" />
                        <button className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                          Mark paid
                        </button>
                      </form>
                    )}
                    <form action={deleteFeeRecord}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-600">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
