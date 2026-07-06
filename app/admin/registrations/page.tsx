import { prisma } from "@/lib/db";
import { approveRegistration, rejectRegistration } from "@/app/actions/admin";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function RegistrationsPage() {
  const requests = await prisma.registrationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });
  const pending = requests.filter((r) => r.status === "NEW");
  const processed = requests.filter((r) => r.status !== "NEW");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Registration Requests</h1>

      <section>
        <h2 className="mb-3 font-semibold text-slate-500">New ({pending.length})</h2>
        <div className="space-y-4">
          {pending.length === 0 && <p className="text-slate-500">No new requests.</p>}
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-sm">
              <div className="grid gap-1 sm:grid-cols-2">
                <p className="text-lg font-bold text-brand-dark">{r.name}</p>
                <p className="text-sm text-slate-500 sm:text-right">Requested {fmt(r.createdAt)}</p>
                <p className="text-sm text-slate-600">📞 {r.phone}</p>
                <p className="text-sm text-slate-600">✉️ {r.email || "—"}</p>
                <p className="text-sm text-slate-600">📚 {r.course?.titleEn || "Any course"}</p>
                <p className="text-sm text-slate-600">🗓 Prefers: {fmt(r.preferredSlot)}</p>
              </div>
              {r.message && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{r.message}</p>}

              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <form action={approveRegistration} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Login email</label>
                    <input name="email" defaultValue={r.email} required className={`${input} min-w-[14rem]`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Set password</label>
                    <input name="password" required className={input} />
                  </div>
                  <button className="btn btn-primary !py-2 text-sm">✓ Approve &amp; create login</button>
                </form>
                <form action={rejectRegistration}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-slate-500">Processed</h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {processed.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-700">{r.name} · {r.course?.titleEn || "—"}</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")
                  }
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
