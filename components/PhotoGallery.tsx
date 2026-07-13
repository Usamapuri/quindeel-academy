"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEdit } from "./EditProvider";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import { signUpload, addPhoto, deletePhoto } from "@/app/actions/gallery";
import { cld, THUMB, FULL } from "@/lib/cld";

type Photo = { id: string; url: string };

export function PhotoGallery({
  photos,
  configured,
  lang = "en",
}: {
  photos: Photo[];
  configured: boolean;
  lang?: "en" | "ur";
}) {
  const { canEdit } = useEdit();
  const ur = lang === "ur";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null); // index of the photo shown enlarged
  const fileRef = useRef<HTMLInputElement>(null);

  const step = (d: number) => setZoom((z) => (z === null ? z : (z + d + photos.length) % photos.length));

  // Keyboard controls + lock background scroll while the lightbox is open.
  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, photos.length]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const sig = await signUpload(); // signed server-side; secret never sent here
        if (!sig) break;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) continue;
        const data = await res.json();
        const af = new FormData();
        af.append("url", data.secure_url);
        af.append("publicId", data.public_id);
        await addPhoto(af);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy || !configured}
            className="btn btn-primary !py-2 text-sm disabled:opacity-60"
          >
            {busy ? (ur ? "اپ لوڈ ہو رہا ہے…" : "Uploading…") : `📷 ${ur ? "تصویریں شامل کریں" : "Add photos"}`}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          {!configured && (
            <span className="text-xs font-semibold text-red-600">
              {ur ? "کلاؤڈنری ترتیب نہیں دیا گیا" : "Cloudinary not configured"}
            </span>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-slate-500">{ur ? "ابھی کوئی تصویر نہیں۔" : "No photos yet."}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cld(p.url, THUMB)}
                alt=""
                loading="lazy"
                onClick={() => setZoom(i)}
                className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
              />
              {canEdit && (
                <div className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100">
                  <ConfirmDeleteButton
                    action={deletePhoto}
                    fields={{ id: p.id }}
                    message={ur ? "یہ تصویر حذف کریں؟" : "Delete this photo?"}
                    className="grid h-7 w-7 place-items-center rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                  >
                    ✕
                  </ConfirmDeleteButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click-to-zoom lightbox (students + teachers) */}
      {zoom !== null && photos[zoom] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label={ur ? "بند کریں" : "Close"}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label={ur ? "پچھلی" : "Previous"}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-3xl leading-none text-white hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label={ur ? "اگلی" : "Next"}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-3xl leading-none text-white hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cld(photos[zoom].url, FULL)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />

          {photos.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              {zoom + 1} / {photos.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
