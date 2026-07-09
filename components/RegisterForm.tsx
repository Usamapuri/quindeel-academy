"use client";

import { useActionState } from "react";
import { useT } from "./LangProvider";
import { registerAction, type RegisterState } from "@/app/actions/register";

type CourseOpt = { id: string; titleEn: string; titleUr: string; slug: string };

export function RegisterForm({
  courses,
  preselectSlug,
  lang,
}: {
  courses: CourseOpt[];
  preselectSlug?: string;
  lang: "en" | "ur";
}) {
  const t = useT();
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center text-lg font-semibold text-emerald-800">
        ✅ {t("register.thanks")}
      </div>
    );
  }

  const preselectId = courses.find((c) => c.slug === preselectSlug)?.id ?? "";
  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{state.error}</p>
      )}

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.name")}</span>
        <input name="name" required className={inputCls} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-semibold text-brand-dark">{t("common.phone")}</span>
          <input
            name="phone"
            required
            type="tel"
            inputMode="tel"
            pattern="[0-9+()\-\s]{7,}"
            title={lang === "ur" ? "براہ کرم درست فون نمبر درج کریں (صرف ہندسے)" : "Please enter a valid phone number (digits only)"}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold text-brand-dark">{t("common.email")}</span>
          <input name="email" type="email" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.course")}</span>
        <select name="courseId" defaultValue={preselectId} className={inputCls}>
          <option value="">{t("common.selectCourse")}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === "ur" ? c.titleUr : c.titleEn}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.preferredTime")}</span>
        <input name="preferredSlot" type="datetime-local" className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{t("common.message")}</span>
        <textarea name="message" rows={3} className={inputCls} />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary w-full text-lg disabled:opacity-60">
        {pending ? t("common.saving") : t("common.submit")}
      </button>
    </form>
  );
}
