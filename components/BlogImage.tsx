"use client";

import { useRef, useState, useTransition } from "react";
import { useEdit } from "./EditProvider";
import { saveContent } from "@/app/actions/content";

// Downscale a picked file to a data URL small enough to store inline.
function fileToDataUrl(file: File, maxDim = 1200): Promise<string> {
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

// Optional cover picture for a blog post. The teacher can add / change / remove
// it; everyone else just sees it (read-only). Stored inline via saveContent.
export function BlogImage({ postId, initial, lang = "en" }: { postId: string; initial: string; lang?: "en" | "ur" }) {
  const { canEdit } = useEdit();
  const ur = lang === "ur";
  const [src, setSrc] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function save(next: string) {
    setSrc(next);
    setStatus("saving");
    startTransition(async () => {
      const res = await saveContent(`blog:${postId}:image`, next);
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) setTimeout(() => setStatus("idle"), 1200);
    });
  }

  async function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      save(await fileToDataUrl(file));
    } catch {
      /* ignore unreadable file */
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!canEdit) {
    // eslint-disable-next-line @next/next/no-img-element
    return src ? <img src={src} alt="" className="mb-4 w-full rounded-xl" /> : null;
  }

  return (
    <div className="mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="w-full rounded-xl" />}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-light"
        >
          🖼️ {src ? (ur ? "تصویر بدلیں" : "Change picture") : (ur ? "تصویر شامل کریں" : "Add picture")}
        </button>
        {src && (
          <button
            type="button"
            onClick={() => save("")}
            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            {ur ? "ہٹائیں" : "Remove"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {status !== "idle" && (
          <span className={"rounded px-2 py-0.5 text-xs font-medium text-white " + (status === "saving" ? "bg-amber-500" : "bg-emerald-600")}>
            {status === "saving" ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : ur ? "✓ محفوظ" : "✓ Saved"}
          </span>
        )}
      </div>
    </div>
  );
}
