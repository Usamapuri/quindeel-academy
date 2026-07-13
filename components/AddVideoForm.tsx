"use client";

import { useActionState } from "react";
import { addVideo, type VideoState } from "@/app/actions/video";

type CourseOpt = { id: string; title: string };

export function AddVideoForm({ lang, courses }: { lang: "en" | "ur"; courses: CourseOpt[] }) {
  const ur = lang === "ur";
  const [state, action, pending] = useActionState<VideoState, FormData>(addVideo, {});
  const control =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="url"
          type="url"
          required
          placeholder={ur ? "یوٹیوب لنک یہاں پیسٹ کریں…" : "Paste a YouTube link…"}
          className={`${control} flex-1`}
        />
        <button disabled={pending} className="btn btn-primary !py-2 text-sm disabled:opacity-60">
          {pending ? (ur ? "شامل ہو رہا ہے…" : "Adding…") : ur ? "ویڈیو شامل کریں" : "Add video"}
        </button>
      </div>
      <input
        name="description"
        placeholder={ur ? "تفصیل (اختیاری) — یہ ویڈیو کس بارے میں ہے" : "Description (optional) — what this video is about"}
        className={`${control} mt-2 w-full`}
      />
      {courses.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-semibold text-slate-500">
            {ur ? "لیکچر کے طور پر ان کورسز میں دکھائیں (کوئی منتخب نہ کریں = عوامی):" : "Show as a lecture in these courses (select none = public):"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {courses.map((c) => (
              <label key={c.id} className="cursor-pointer select-none">
                <input type="checkbox" name="courseId" value={c.id} className="peer sr-only" />
                <span className="inline-block rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-500 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                  {c.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      {state.error && (
        <p className="mt-2 text-sm font-medium text-red-600">{ur ? "براہ کرم درست یوٹیوب لنک پیسٹ کریں۔" : state.error}</p>
      )}
    </form>
  );
}
