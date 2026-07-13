import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { dir } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/auth";
import { AdminNav } from "@/components/AdminNav";
import { LangToggle } from "@/components/LangToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("TEACHER");
  const lang = await getLang();
  const ur = lang === "ur";

  return (
    <div dir={dir(lang)} className="flex min-h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <Image src="/logo.jpeg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            </span>
            <div>
              <p className="font-bold leading-tight text-brand-dark">
                {ur ? "قندیل اکیڈمی — ایڈمن" : "Quindeel Academy — Admin"}
              </p>
              <p className="text-xs text-slate-500">{session.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle tone="dark" />
            <Link href="/" className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              {ur ? "سائٹ دیکھیں" : "View Site"}
            </Link>
            <form action={logoutAction}>
              <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-brand-dark">
                {ur ? "لاگ آؤٹ" : "Log out"}
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-6xl">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
