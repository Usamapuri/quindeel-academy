"use client";

import { useActionState } from "react";
import { useT } from "./LangProvider";
import { loginAction, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const t = useT();
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{state.error}</p>
      )}
      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.email")}</span>
        <input name="email" type="email" required autoComplete="username" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.password")}</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary w-full text-lg disabled:opacity-60">
        {pending ? t("common.saving") : t("login.button")}
      </button>
    </form>
  );
}
