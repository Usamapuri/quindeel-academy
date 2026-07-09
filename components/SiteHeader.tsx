"use client";

import Link from "next/link";
import Image from "next/image";
import { useT } from "./LangProvider";
import { LangToggle } from "./LangToggle";
import { logoutAction } from "@/app/actions/auth";

type Props = {
  academyName: string;
  session: { role: "TEACHER" | "STUDENT"; name: string } | null;
};

export function SiteHeader({ academyName, session }: Props) {
  const t = useT();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/courses", label: t("nav.courses") },
    { href: "/fees", label: t("nav.fees") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/register", label: t("nav.register") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-brand-dark ring-2 ring-brand/30">
            <Image src="/logo.png" alt="Quindeel Academy" width={48} height={48} className="h-12 w-12 object-cover" />
          </span>
          <span className="text-lg font-bold leading-tight text-brand-dark sm:text-xl">
            {academyName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LangToggle className="!border-brand/40 !bg-brand-light !text-brand" />
          {session ? (
            <>
              <Link
                href={session.role === "TEACHER" ? "/admin" : "/portal"}
                className="btn btn-primary !px-4 !py-1.5 text-sm"
              >
                {session.role === "TEACHER" ? t("nav.admin") : t("nav.portal")}
              </Link>
              <form action={logoutAction}>
                <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-brand-dark">
                  {t("nav.logout")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-outline !px-4 !py-1.5 text-sm">
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>

      <nav className="border-t border-slate-100 bg-brand-light/40">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-brand-dark hover:bg-brand hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
