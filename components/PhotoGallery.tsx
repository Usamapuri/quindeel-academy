"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEdit } from "./EditProvider";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import { signUpload, addPhoto, deletePhoto } from "@/app/actions/gallery";
import { cld, THUMB } from "@/lib/cld";

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
  const fileRef = useRef<HTMLInputElement>(null);

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
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cld(p.url, THUMB)} alt="" loading="lazy" className="h-full w-full object-cover" />
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
    </div>
  );
}
