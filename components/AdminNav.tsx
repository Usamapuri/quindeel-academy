"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";

const LINKS = [
  { href: "/admin", en: "Dashboard", ur: "ڈیش بورڈ", icon: "🏠" },
  { href: "/admin/learners", en: "Learners", ur: "طلبہ", icon: "👤" },
  { href: "/admin/registrations", en: "Registrations", ur: "رجسٹریشنز", icon: "📥" },
  { href: "/admin/fees", en: "Fee Records", ur: "فیس ریکارڈ", icon: "💳" },
  { href: "/admin/live", en: "Live Classes", ur: "لائیو کلاسز", icon: "🎥" },
  { href: "/admin/recordings", en: "Recordings", ur: "ریکارڈنگز", icon: "▶️" },
  { href: "/admin/courses", en: "Courses", ur: "کورسز", icon: "📚" },
  { href: "/admin/google", en: "Google", ur: "گوگل", icon: "🔗" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  return (
    <nav className="flex gap-1 overflow-x-auto px-4 py-2">
      {LINKS.map((l) => {
        const label = lang === "ur" ? l.ur : l.en;
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition " +
              (active ? "bg-brand text-white" : "text-brand-dark hover:bg-brand-light")
            }
          >
            <span aria-hidden>{l.icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
