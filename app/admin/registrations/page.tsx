import Link from "next/link";
import { prisma } from "@/lib/db";
import { decideRegistrations, setCourseDecisionForEmail, deleteRejectedCourse, decideUnregister } from "@/app/actions/admin";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { getLang } from "@/lib/lang";
import { pick, type Lang } from "@/lib/i18n";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function fmt(d: Date | null, lang: Lang) {
  if (!d) return "—";
  return new Date(d).toLocaleString(lang === "ur" ? "ur-PK" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
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
  { id: "pending", en: "Pending", ur: "زیرِ التوا", status: "NEW" as const },
  { id: "approved", en: "Approved", ur: "منظور شدہ", status: "APPROVED" as const },
  { id: "rejected", en: "Rejected", ur: "مسترد", status: "REJECTED" as const },
];

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "pending";
  const q = (sp.q ?? "").trim().toLowerCase();
  const sort = sp.sort ?? "";

  const [all, students, unregisters] = await Promise.all([
    loadRequests(),
    prisma.user.findMany({ where: { role: "STUDENT" }, select: { email: true } }),
    prisma.unregisterRequest.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      include: { course: true },
    }),
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

  const chip = (r: Req) =>
    r.course ? pick(lang, r.course.titleEn, r.course.titleUr) : ur ? "کوئی بھی کورس" : "Any course";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{ur ? "رجسٹریشن درخواستیں" : "Registration Requests"}</h1>

      {/* Unregister requests — a student asked to leave a course; teacher decides */}
      {unregisters.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="mb-2 font-bold text-amber-800">
            🚪 {ur ? "کورس چھوڑنے کی درخواستیں" : "Unregister requests"} ({unregisters.length})
          </p>
          <div className="space-y-2">
            {unregisters.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-brand-dark">{u.name}</span>
                  {u.email ? ` (${u.email})` : ""} — {ur ? "چھوڑنا چاہتے ہیں:" : "wants to leave:"}{" "}
                  <span className="font-semibold">{pick(lang, u.course.titleEn, u.course.titleUr)}</span>
                </span>
                <div className="flex gap-2">
                  <form action={decideUnregister}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="approve" value="true" />
                    <button className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">
                      {ur ? "منظور (نکالیں)" : "Approve (remove)"}
                    </button>
                  </form>
                  <form action={decideUnregister}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="approve" value="false" />
                    <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      {ur ? "مسترد (رکھیں)" : "Deny (keep)"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {(ur ? t.ur : t.en)} ({counts[t.id as keyof typeof counts]})
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
          placeholder={ur ? "نام / ای میل / فون سے تلاش کریں" : "Search by name / email / phone"}
          className={`${input} w-56`}
        />
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          {ur ? "ترتیب" : "Sort"}
          <select name="sort" defaultValue={sort} className={input}>
            <option value="">{ur ? "تازہ ترین" : "Newest"}</option>
            <option value="oldest">{ur ? "قدیم ترین" : "Oldest"}</option>
            <option value="name">{ur ? "نام: الف سے ے" : "Name A–Z"}</option>
            <option value="name_desc">{ur ? "نام: ے سے الف" : "Name Z–A"}</option>
          </select>
        </label>
        <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
          {ur ? "لاگو کریں" : "Apply"}
        </button>
        {(q || sort) && (
          <Link
            href={`/admin/registrations${tab === "pending" ? "" : `?tab=${tab}`}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            {ur ? "صاف کریں" : "Clear"}
          </Link>
        )}
      </form>

      {groups.length === 0 && (
        <p className="text-slate-500">
          {q
            ? ur ? "تلاش سے کوئی درخواست نہیں ملی۔" : "No requests match the search."
            : ur ? "کوئی درخواست نہیں۔" : `No ${tab} requests.`}
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
                      {g.email || (ur ? "کوئی ای میل نہیں" : "no email")}
                      {g.phone ? ` · 📞 ${g.phone}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {ur ? "درخواست: " : "Requested "}
                    {fmt(g.items.map((i) => i.createdAt).sort((a, b) => +b - +a)[0], lang)}
                  </p>
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {ur
                    ? "منظوری کے لیے کورسز پر نشان لگائیں · غیر نشان زدہ مسترد ہوں گے"
                    : "Tick courses to approve · unticked will be rejected"}
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
                        {chip(r)}
                      </span>
                    </label>
                  ))}
                </div>

                {needsLogin && (
                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        {ur ? "لاگ اِن ای میل" : "Login email"}
                      </label>
                      <input value={g.email} readOnly className={`${input} min-w-[14rem] bg-slate-50`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">
                        {ur ? "پاس ورڈ مقرر کریں (نیا طالب علم)" : "Set password (new student)"}
                      </label>
                      <input name="password" className={input} placeholder={ur ? "منظوری کے لیے لازمی" : "Required to approve"} />
                    </div>
                  </div>
                )}
                {!g.email && (
                  <p className="mt-3 text-xs font-semibold text-red-600">
                    {ur
                      ? "اس درخواست پر کوئی ای میل نہیں — اسے صرف مسترد کیا جا سکتا ہے (لاگ اِن کے لیے ای میل ضروری ہے)۔"
                      : "No email on this request — it can only be rejected (a login needs an email)."}
                  </p>
                )}

                <div className="mt-4">
                  <button className="btn btn-primary !py-2 text-sm">{ur ? "فیصلے محفوظ کریں" : "Confirm decisions"}</button>
                </div>
              </form>
            );
          })}
        </div>
      )}

      {/* ---------- APPROVED / REJECTED: one chip per course; click to flip ---------- */}
      {tab !== "pending" && (
        <div className="space-y-4">
          {groups.map((g) => {
            const flipTo = tab === "approved" ? "REJECTED" : "APPROVED";
            // One chip per course — collapse duplicate requests for the same course.
            const seen = new Set<string>();
            const uniqueItems = g.items.filter((r) => {
              const key = r.courseId ?? "__any__";
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return (
              <div key={g.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand-dark">{g.name}</p>
                    <p className="text-sm text-slate-500">{g.email || (ur ? "کوئی ای میل نہیں" : "no email")}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {tab === "approved"
                      ? ur ? "مسترد کرنے کے لیے کورس پر کلک کریں" : "Click a course to reject it"
                      : ur ? "منظور کرنے کے لیے کورس پر کلک کریں · حذف کے لیے ✕" : "Click a course to approve it · ✕ to delete"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {uniqueItems.map((r) => (
                    <div key={r.courseId ?? "__any__"} className="flex items-center gap-1">
                      <form action={setCourseDecisionForEmail}>
                        <input type="hidden" name="email" value={g.email} />
                        <input type="hidden" name="courseId" value={r.courseId ?? ""} />
                        <input type="hidden" name="status" value={flipTo} />
                        <button
                          className={
                            "rounded-full px-3 py-1 text-xs font-semibold transition " +
                            (tab === "approved"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                              : "bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700")
                          }
                          title={tab === "approved" ? (ur ? "اس کورس کو مسترد کریں" : "Reject this course") : (ur ? "اس کورس کو منظور کریں" : "Approve this course")}
                        >
                          {tab === "approved" ? "✓ " : "✗ "}
                          {chip(r)}
                        </button>
                      </form>
                      {tab === "rejected" && (
                        <ConfirmDeleteButton
                          action={deleteRejectedCourse}
                          fields={{ email: g.email, courseId: r.courseId ?? "" }}
                          message={
                            ur
                              ? `"${chip(r)}" کو مسترد فہرست سے مستقل طور پر حذف کریں؟`
                              : `Permanently delete "${chip(r)}" from the rejected list?`
                          }
                          className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 hover:bg-red-600 hover:text-white"
                        >
                          ✕
                        </ConfirmDeleteButton>
                      )}
                    </div>
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
