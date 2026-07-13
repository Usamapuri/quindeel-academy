"use client";

import { useActionState } from "react";
import { addVideo, type VideoState } from "@/app/actions/video";

export function AddVideoForm({ lang }: { lang: "en" | "ur" }) {
  const ur = lang === "ur";
  const [state, action, pending] = useActionState<VideoState, FormData>(addVideo, {});

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="url"
          type="url"
          required
          placeholder={ur ? "یوٹیوب لنک یہاں پیسٹ کریں…" : "Paste a YouTube link…"}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button disabled={pending} className="btn btn-primary !py-2 text-sm disabled:opacity-60">
          {pending ? (ur ? "شامل ہو رہا ہے…" : "Adding…") : ur ? "ویڈیو شامل کریں" : "Add video"}
        </button>
      </div>
      <input
        name="description"
        placeholder={ur ? "تفصیل (اختیاری) — یہ ویڈیو کس بارے میں ہے" : "Description (optional) — what this video is about"}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      {state.error && <p className="mt-2 text-sm font-medium text-red-600">{ur ? "براہ کرم درست یوٹیوب لنک پیسٹ کریں۔" : state.error}</p>}
    </form>
  );
}
