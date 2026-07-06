"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/learners", label: "Learners", icon: "👤" },
  { href: "/admin/registrations", label: "Registrations", icon: "📥" },
  { href: "/admin/fees", label: "Fee Records", icon: "💳" },
  { href: "/admin/live", label: "Live Classes", icon: "🎥" },
  { href: "/admin/recordings", label: "Recordings", icon: "▶️" },
  { href: "/admin/courses", label: "Courses", icon: "📚" },
  { href: "/admin/google", label: "Google", icon: "🔗" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-4 py-2">
      {LINKS.map((l) => {
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
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
