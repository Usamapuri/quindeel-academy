"use client";

import { useState } from "react";
import { youtubeThumb } from "@/lib/youtube";

// Shows the thumbnail + title; loads the embedded player only when clicked,
// so a page of videos stays light (just images until you press play).
export function VideoCard({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const label = title || "YouTube video";

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-sm">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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
            <img src={youtubeThumb(videoId)} alt={label} className="h-full w-full object-cover transition group-hover:opacity-90" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-red-600/90 text-2xl text-white shadow-lg transition group-hover:scale-110">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 line-clamp-2 font-semibold text-brand-dark">{label}</p>
    </div>
  );
}
