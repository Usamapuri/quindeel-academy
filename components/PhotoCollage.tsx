"use client";

import { useEffect, useState } from "react";
import { cld, COLLAGE, FULL } from "@/lib/cld";

// Static, read-only photo collage for the home page. Masonry via CSS columns so
// every photo keeps its natural aspect ratio — nothing is cropped (unlike the old
// c_fill slideshow). Click any photo to open a lightweight lightbox.
export function PhotoCollage({ urls, lang = "en" }: { urls: string[]; lang?: "en" | "ur" }) {
  const ur = lang === "ur";
  const [zoom, setZoom] = useState<number | null>(null);

  const step = (d: number) =>
    setZoom((z) => (z === null ? z : (z + d + urls.length) % urls.length));

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
  }, [zoom, urls.length]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="mx-auto max-w-5xl columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
        {urls.map((u, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setZoom(i)}
            className="block w-full break-inside-avoid overflow-hidden rounded-xl bg-slate-100 shadow-sm transition hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cld(u, COLLAGE)} alt="" loading="lazy" className="w-full cursor-zoom-in" />
          </button>
        ))}
      </div>

      {zoom !== null && urls[zoom] && (
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

          {urls.length > 1 && (
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
            src={cld(urls[zoom], FULL)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />

          {urls.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              {zoom + 1} / {urls.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
