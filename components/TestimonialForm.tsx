"use client";

import { useActionState, useRef, useState } from "react";
import { submitTestimonial, type SubmitState } from "@/app/actions/testimonial";

// Downscale a picked photo to a small data URL so it can be stored inline.
// Same approach as the blog cover picker.
function fileToDataUrl(file: File, maxDim = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const s = maxDim / Math.max(width, height);
          width = Math.round(width * s);
          height = Math.round(height * s);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function TestimonialForm({ token, lang }: { token: string; lang: "en" | "ur" }) {
  const ur = lang === "ur";
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitTestimonial.bind(null, token),
    {},
  );
  const [photo, setPhoto] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center text-lg font-semibold text-emerald-800">
        ✅ {ur ? "شکریہ! آپ کا تاثر موصول ہو گیا ہے۔" : "Thank you! Your testimonial has been received."}
        <p className="mt-2 text-sm font-normal text-emerald-700">
          {ur ? "استاد صاحب کی منظوری کے بعد یہ ویب سائٹ پر دکھایا جا سکتا ہے۔" : "It may appear on the website once the teacher approves it."}
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  async function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setPhoto(await fileToDataUrl(file));
    } catch {
      /* ignore unreadable file */
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {state.error === "invalid-link"
            ? ur
              ? "یہ لنک اب کارآمد نہیں رہا۔ براہ کرم استاد سے نیا لنک طلب کریں۔"
              : "This link is no longer valid. Please ask the teacher for a new one."
            : ur
              ? "براہ کرم اپنا نام اور تاثر ضرور لکھیں۔"
              : "Please enter your name and your testimonial."}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{ur ? "آپ کا نام" : "Your name"}</span>
        <input name="author" required maxLength={120} className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">
          {ur ? "آپ کون ہیں؟ (اختیاری)" : "Who are you? (optional)"}
        </span>
        <input
          name="role"
          maxLength={120}
          placeholder={ur ? "مثلاً: والد / او لیول طالب علم" : "e.g. Parent / O-Level student"}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold text-brand-dark">{ur ? "آپ کا تاثر" : "Your testimonial"}</span>
        <textarea name="quote" required rows={5} maxLength={2000} className={inputCls} />
      </label>

      <div>
        <span className="mb-1 block font-semibold text-brand-dark">{ur ? "تصویر (اختیاری)" : "Photo (optional)"}</span>
        <input type="hidden" name="photo" value={photo} />
        <div className="flex flex-wrap items-center gap-3">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand hover:bg-brand-light"
          >
            🖼️ {photo ? (ur ? "تصویر بدلیں" : "Change photo") : ur ? "تصویر شامل کریں" : "Add a photo"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto("")}
              className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              {ur ? "ہٹائیں" : "Remove"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full text-lg disabled:opacity-60">
        {pending ? (ur ? "بھیجا جا رہا ہے…" : "Sending…") : ur ? "تاثر بھیجیں" : "Send testimonial"}
      </button>
    </form>
  );
}
