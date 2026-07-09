"use client";

import { useLang } from "./LangProvider";

// tone "light" = for coloured headers (white text); "dark" = for light backgrounds (admin).
export function LangToggle({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const { lang, setLang } = useLang();
  const toneCls =
    tone === "dark"
      ? "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
      : "border-white/30 bg-white/10 text-white hover:bg-white/20";
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${toneCls} ${className}`}
      aria-label="Switch language"
    >
      {lang === "en" ? "اردو" : "English"}
    </button>
  );
}
