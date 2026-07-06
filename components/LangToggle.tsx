"use client";

import { useLang } from "./LangProvider";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      className={`rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 ${className}`}
      aria-label="Switch language"
    >
      {lang === "en" ? "اردو" : "English"}
    </button>
  );
}
