import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { logoutAction } from "@/app/actions/auth";
import { LangToggle } from "@/components/LangToggle";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const s = await getSettings();
  const academyName = s[settingKey("academyName", lang)] || "Quindeel Academy";
  const footerNote = s.footerNote || "";

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/portal" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-black/30">
              <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 object-cover" />
            </span>
            <span className="font-bold">{academyName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-white/80 sm:inline">{session.name}</span>
            <LangToggle />
            <form action={logoutAction}>
              <button className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25">
                {lang === "ur" ? "لاگ آؤٹ" : "Log out"}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      {footerNote && (
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl whitespace-pre-wrap px-4 py-6 text-center text-sm text-slate-600">
            {footerNote}
          </div>
        </footer>
      )}
    </div>
  );
}
