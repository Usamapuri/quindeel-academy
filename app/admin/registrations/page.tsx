import Link from "next/link";
import { prisma } from "@/lib/db";
import { decideRegistrations, setRegistrationCourseStatus } from "@/app/actions/admin";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

type Req = Awaited<ReturnType<typeof loadRequests>>[number];
async function loadRequests() {
  return prisma.registrationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });
}

type Group = { key: string; email: string; name: string; phone: string; items: Req[] };

function groupByEmail(list: Req[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of list) {
    const email = (r.email || "").trim().toLowerCase();
    // Requests with no email can't be merged (email is the identity), so each
    // stands alone under a unique key.
    const key = email || `__noemail__${r.id}`;
    let g = map.get(key);
    if (!g) {
      g = { key, email, name: r.name, phone: r.phone, items: [] };
      map.set(key, g);
    }
    g.items.push(r);
  }
  return [...map.values()];
}

const TABS = [
  { id: "pending", label: "Pending", status: "NEW" as const },
  { id: "approved", label: "Approved", status: "APPROVED" as const },
  { id: "rejected", label: "Rejected", status: "REJECTED" as const },
];

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "pending";
  const q = (sp.q ?? "").trim().toLowerCase();
  const sort = sp.sort ?? "";

  const [all, students] = await Promise.all([
    loadRequests(),
    prisma.user.findMany({ where: { role: "STUDENT" }, select: { email: true } }),
  ]);
  const accounts = new Set(students.map((s) => s.email.toLowerCase()));

  const matchesQ = (r: Req) =>
    !q ||
    r.name.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.phone.toLowerCase().includes(q);

  const groupsFor = (status: "NEW" | "APPROVED" | "REJECTED") => {
    const groups = groupByEmail(all.filter((r) => r.status === status && matchesQ(r)));
    groups.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      const aLatest = Math.max(...a.items.map((i) => +i.createdAt));
      const bLatest = Math.max(...b.items.map((i) => +i.createdAt));
      return sort === "oldest" ? aLatest - bLatest : bLatest - aLatest;
    });
    return groups;
  };

  const counts = {
    pending: groupByEmail(all.filter((r) => r.status === "NEW")).length,
    approved: groupByEmail(all.filter((r) => r.status === "APPROVED")).length,
    rejected: groupByEmail(all.filter((r) => r.status === "REJECTED")).length,
  };

  const activeStatus = TABS.find((t) => t.id === tab)!.status;
  const groups = groupsFor(activeStatus);
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (sort) p.set("sort", sort);
    for (const [k, v] of Object.entries(over)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const chip = (courseTitle: string) => courseTitle || "Any course";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Registration Requests</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/admin/registrations${qs({ tab: t.id === "pending" ? "" : t.id })}`}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold transition " +
                (active ? "bg-white text-brand-dark shadow-sm" : "text-slate-500 hover:text-brand-dark")
              }
            >
              {t.label} ({counts[t.id as keyof typeof counts]})
            </Link>
          );
        })}
      </div>

      {/* Search + sort (keeps the current tab) */}
      <form method="get" action="/admin/registrations" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value={tab} />
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by name / email / phone"
          className={`${input} w-56`}
        />
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          Sort
          <select name="sort" defaultValue={sort} className={input}>
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </label>
        <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Apply
        </button>
        {(q || sort) && (
          <Link
            href={`/admin/registrations${tab === "pending" ? "" : `?tab=${tab}`}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Clear
          </Link>
        )}
      </form>

      {groups.length === 0 && (
        <p className="text-slate-500">
          {q ? "No requests match the search." : `No ${tab} requests.`}
        </p>
      )}

      {/* ---------- PENDING: check to approve, uncheck to reject ---------- */}
      {tab === "pending" && (
        <div className="space-y-4">
          {groups.map((g) => {
            const needsLogin = !!g.email && !accounts.has(g.email);
            return (
              <form
                key={g.key}
                action={decideRegistrations}
                className="rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-sm"
              >
                <input type="hidden" name="email" value={g.email} />
                <input type="hidden" name="all" value={g.items.map((i) => i.id).join(",")} />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-brand-dark">{g.name}</p>
                    <p className="text-sm text-slate-500">
                      {g.email || "no email"}
                      {g.phone ? ` · 📞 ${g.phone}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-slate-400">
                    Requested {fmt(g.items.map((i) => i.createdAt).sort((a, b) => +b - +a)[0])}
                  </p>
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tick courses to approve · unticked will be rejected
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.items.map((r) => (
                    <label key={r.id} className="cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="approve"
                        value={r.id}
                        defaultChecked
                        className="peer sr-only"
                      />
                      <span className="inline-block rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                        {chip(r.course?.titleEn ?? "")}
                      </span>
                    </label>
                  ))}
                </div>

                {needsLogin && (
                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        Login email
                      </label>
                      <input value={g.email} readOnly className={`${input} min-w-[14rem] bg-slate-50`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        Set password (new student)
                      </label>
                      <input name="password" className={input} placeholder="Required to approve" />
                    </div>
                  </div>
                )}
                {!g.email && (
                  <p className="mt-3 text-xs font-semibold text-red-600">
                    No email on this request — it can only be rejected (a login needs an email).
                  </p>
                )}

                <div className="mt-4">
                  <button className="btn btn-primary !py-2 text-sm">Confirm decisions</button>
                </div>
              </form>
            );
          })}
        </div>
      )}

      {/* ---------- APPROVED / REJECTED: click a chip to flip it ---------- */}
      {tab !== "pending" && (
        <div className="space-y-4">
          {groups.map((g) => {
            const flipTo = tab === "approved" ? "REJECTED" : "APPROVED";
            return (
              <div key={g.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand-dark">{g.name}</p>
                    <p className="text-sm text-slate-500">{g.email || "no email"}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {tab === "approved" ? "Click a course to reject it" : "Click a course to approve it"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.items.map((r) => (
                    <form key={r.id} action={setRegistrationCourseStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={flipTo} />
                      <button
                        className={
                          "rounded-full px-3 py-1 text-xs font-semibold transition " +
                          (tab === "approved"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                            : "bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700")
                        }
                        title={tab === "approved" ? "Reject this course" : "Approve this course"}
                      >
                        {tab === "approved" ? "✓ " : "✗ "}
                        {chip(r.course?.titleEn ?? "")}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
