import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const [learners, pending, courses, live, recordings, dueFees] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.registrationRequest.count({ where: { status: "NEW" } }),
    prisma.course.count(),
    prisma.classSession.count(),
    prisma.recording.count(),
    prisma.feeRecord.count({ where: { status: "DUE" } }),
  ]);

  const stats = [
    { label: "Learners", value: learners, href: "/admin/learners", icon: "👤" },
    { label: "New Requests", value: pending, href: "/admin/registrations", icon: "📥", highlight: pending > 0 },
    { label: "Courses", value: courses, href: "/admin/courses", icon: "📚" },
    { label: "Live Classes", value: live, href: "/admin/live", icon: "🎥" },
    { label: "Recordings", value: recordings, href: "/admin/recordings", icon: "▶️" },
    { label: "Fees Due", value: dueFees, href: "/admin/fees", icon: "💳", highlight: dueFees > 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark">Welcome</h1>
      <p className="mt-1 text-slate-600">
        Manage your learners, classes, and fees here. To change any text or course names on the
        website, just open the site and click the text to edit it.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={
              "flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md " +
              (s.highlight ? "border-amber-400" : "border-slate-200")
            }
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-2xl">{s.icon}</span>
            <div>
              <p className="text-3xl font-extrabold text-brand-dark">{s.value}</p>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-light/50 p-6">
        <h2 className="font-bold text-brand-dark">✏️ Editing the website</h2>
        <p className="mt-1 text-slate-700">
          Open <Link href="/" className="font-semibold text-brand underline">your website</Link>, and
          while you are logged in you can click on any heading, description, course name, or fee to
          change it. Use the language button (اردو / English) to edit the Urdu and English versions.
        </p>
      </div>
    </div>
  );
}
