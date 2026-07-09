"use client";

import { useActionState } from "react";
import { useT } from "./LangProvider";
import { unregisterAction, type RegisterState } from "@/app/actions/register";

type CourseOpt = { id: string; titleEn: string; titleUr: string };

// Sits below the register form. A student requests to LEAVE a course; the server
// checks they're actually enrolled (by email), and the teacher decides.
export function UnregisterForm({ courses, lang }: { courses: CourseOpt[]; lang: "en" | "ur" }) {
  const t = useT();
  const ur = lang === "ur";
  const [state, action, pending] = useActionState<RegisterState, FormData>(unregisterAction, {});

  if (state.ok) {
    return (
      <div className="mt-10 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center font-semibold text-amber-800">
        {ur
          ? "✅ آپ کی اَن رجسٹریشن کی درخواست موصول ہو گئی ہے۔ استاد اس کا جائزہ لیں گے۔"
          : "✅ Your unregister request has been received. The teacher will review it."}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="text-center text-2xl font-bold text-brand-dark">
        {ur ? "کورس چھوڑیں (اَن رجسٹر)" : "Leave a course (Unregister)"}
      </h2>
      <p className="mb-6 mt-2 text-center text-slate-600">
        {ur
          ? "اگر آپ کسی کورس سے نکلنا چاہتے ہیں تو نیچے درخواست دیں۔ حتمی فیصلہ استاد کریں گے۔"
          : "If you want to leave a course you're enrolled in, request below. The teacher makes the final decision."}
      </p>

      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm(ur ? "کیا آپ واقعی اس کورس سے اَن رجسٹر ہونا چاہتے ہیں؟" : "Are you sure you want to unregister from this course?")) {
            e.preventDefault();
          }
        }}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
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
              title={ur ? "براہ کرم درست فون نمبر درج کریں" : "Please enter a valid phone number"}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-brand-dark">{t("common.email")}</span>
            <input name="email" type="email" required className={inputCls} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block font-semibold text-brand-dark">
            {ur ? "کورس جو چھوڑنا ہے" : "Course to leave"}
          </span>
          <select name="courseId" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              {t("common.selectCourse")}
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {ur ? c.titleUr : c.titleEn}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" required className="mt-1" />
          <span>
            {ur
              ? "میں تصدیق کرتا/کرتی ہوں کہ میں اس کورس سے اَن رجسٹر ہونا چاہتا/چاہتی ہوں۔"
              : "I confirm that I want to unregister from this course."}
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full border-2 border-amber-500 bg-amber-50 px-6 py-3 text-lg font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
        >
          {pending ? t("common.saving") : ur ? "اَن رجسٹریشن کی درخواست بھیجیں" : "Request to unregister"}
        </button>
      </form>
    </div>
  );
}
