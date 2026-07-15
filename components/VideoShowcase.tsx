"use client";

import { useState } from "react";
import { youtubeThumb } from "@/lib/youtube";

type Item = { videoId: string; title: string };

// Home-page video showcase: one large player on top, a clickable thumbnail strip
// below to switch. No autoplay on load — the embed only loads once the visitor
// presses play (or picks a thumbnail), so the page stays light.
export function VideoShowcase({ items, lang = "en" }: { items: Item[]; lang?: "en" | "ur" }) {
  const ur = lang === "ur";
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (items.length === 0) return null;
  const current = items[active] ?? items[0];
  const label = current.title || "YouTube video";

  const pick = (i: number) => {
    setActive(i);
    setPlaying(true); // switching via a thumbnail plays it straight away
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Featured player */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow">
        {playing ? (
          <iframe
            key={current.videoId}
            src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${label}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={youtubeThumb(current.videoId)} alt={label} className="h-full w-full object-cover transition group-hover:opacity-90" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600/90 text-3xl text-white shadow-lg transition group-hover:scale-110">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>

      {current.title && (
        <p className="mt-3 text-center text-lg font-bold text-brand-dark">{current.title}</p>
      )}

      {/* Thumbnail strip (only when there's more than one) */}
      {items.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {items.map((v, i) => (
            <button
              key={v.videoId}
              type="button"
              onClick={() => pick(i)}
              aria-label={ur ? `چلائیں: ${v.title || "ویڈیو"}` : `Play ${v.title || "video"}`}
              className={
                "relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-slate-900 transition " +
                (i === active ? "ring-2 ring-brand ring-offset-2" : "opacity-80 hover:opacity-100")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={youtubeThumb(v.videoId)} alt={v.title || ""} className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-xs text-white">▶</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
