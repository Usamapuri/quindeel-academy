"use client";

import { useRef, useState, useTransition } from "react";
import { useEdit } from "./EditProvider";
import { saveContent } from "@/app/actions/content";

function fileToDataUrl(file: File, maxDim = 700): Promise<string> {
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
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// A faculty member's photo. Teacher can add/change/remove it (stored inline);
// everyone else just sees it. `rounded` gives a circular avatar on the listing.
export function FacultyPhoto({
  facultyId,
  photo,
  lang = "en",
  size = "card",
}: {
  facultyId: string;
  photo: string;
  lang?: "en" | "ur";
  size?: "card" | "detail";
}) {
  const { canEdit } = useEdit();
  const ur = lang === "ur";
  const [src, setSrc] = useState(photo);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const box = size === "detail" ? "h-40 w-40" : "h-28 w-28";

  function save(next: string) {
    setSrc(next);
    startTransition(() => {
      void saveContent(`faculty:${facultyId}:photo`, next);
    });
  }
  async function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      save(await fileToDataUrl(file));
    } catch {
      /* ignore */
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const avatar = (
    <span className={`grid ${box} place-items-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-brand/20`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-3xl text-slate-300">👤</span>
      )}
    </span>
  );

  if (!canEdit) return avatar;

  return (
    <div className="flex flex-col items-center gap-1">
      {avatar}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-xs font-semibold text-brand hover:underline"
      >
        {src ? (ur ? "تصویر بدلیں" : "Change photo") : (ur ? "تصویر شامل کریں" : "Add photo")}
      </button>
      {src && (
        <button type="button" onClick={() => save("")} className="text-xs font-semibold text-red-500 hover:underline">
          {ur ? "ہٹائیں" : "Remove"}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
