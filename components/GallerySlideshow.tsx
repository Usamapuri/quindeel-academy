"use client";

import { useEffect, useState } from "react";
import { cld, SLIDE } from "@/lib/cld";

// Auto-cycling photo slideshow (~3s per photo) for the home page. Read-only.
export function GallerySlideshow({ urls }: { urls: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (urls.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % urls.length), 3000);
    return () => clearInterval(t);
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-100 shadow">
      {urls.map((u, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={idx}
          src={cld(u, SLIDE)}
          alt=""
          className={
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 " +
            (idx === i ? "opacity-100" : "opacity-0")
          }
        />
      ))}
      {urls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {urls.map((_, idx) => (
            <span key={idx} className={"h-2 w-2 rounded-full " + (idx === i ? "bg-white" : "bg-white/50")} />
          ))}
        </div>
      )}
    </div>
  );
}
