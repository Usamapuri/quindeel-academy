import { prisma } from "@/lib/db";
import { setFeeStatus, deleteFeeRecord } from "@/app/actions/admin";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import FeeRecorder from "@/components/FeeRecorder";

// Best-effort numeric price from a free-text fee like "20,000/month" or "Rs 5000".
function parsePrice(feeText: string): number {
  const m = feeText.replace(/[,\s]/g, "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  DUE: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
};

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const courseFilter = sp.course ?? "";
  const statusFilter = sp.status ?? "";
  const sort = sp.sort ?? "";

  const [students, courses, allRecords] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.feeRecord.findMany({
      where: { deletedAt: null },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
      include: { student: true, course: true },
    }),
  ]);

  const records = allRecords
    .filter((r) => !q || r.student.name.toLowerCase().includes(q))
    .filter((r) => !courseFilter || r.courseId === courseFilter)
    .filter((r) => !statusFilter || r.status === statusFilter)
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.student.name.localeCompare(b.student.name);
        case "amount":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          // Newest: period desc then createdAt desc (matches the DB order)
          return b.period.localeCompare(a.period) || +b.createdAt - +a.createdAt;
      }
    });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Fee Records</h1>

      <FeeRecorder
        students={students.map((s) => ({ id: s.id, name: s.name }))}
        courses={courses.map((c) => ({ id: c.id, title: c.titleEn, price: parsePrice(c.feeText) }))}
      />

      <AdminFilterBar
        basePath="/admin/fees"
        current={sp}
        search={{ name: "q", placeholder: "Search by learner name" }}
        selects={[
          {
            name: "course",
            label: "All courses",
            options: courses.map((c) => ({ value: c.id, label: c.titleEn })),
          },
          {
            name: "status",
            label: "All statuses",
            options: [
              { value: "PAID", label: "Paid" },
              { value: "DUE", label: "Due" },
              { value: "PARTIAL", label: "Partial" },
            ],
          },
        ]}
        sort={{
          name: "sort",
          options: [
            { value: "", label: "Newest period" },
            { value: "name", label: "Learner A–Z" },
            { value: "amount", label: "Amount high→low" },
            { value: "amount_asc", label: "Amount low→high" },
            { value: "status", label: "Status" },
          ],
        }}
      />

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
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">{allRecords.length === 0 ? "No fee records yet." : "No fee records match the filter."}</td></tr>
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
                    <ConfirmDeleteButton
                      action={deleteFeeRecord}
                      fields={{ id: r.id }}
                      message={`Delete the ${r.period} fee record for ${r.student.name}?\n\nThis cannot be undone.`}
                    />
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
