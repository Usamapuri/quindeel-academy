"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG, LANG_COOKIE, t as translate, type Lang, type TKey } from "@/lib/i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<Ctx>({ lang: DEFAULT_LANG, setLang: () => {} });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();

  const setLang = useCallback(
    (l: Lang) => {
      document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
      router.refresh();
    },
    [router]
  );

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  return useContext(LangCtx);
}

/** Client hook: returns a translate function bound to the current language. */
export function useT(): (key: TKey) => string {
  const { lang } = useLang();
  return (key: TKey) => translate(lang, key);
}
