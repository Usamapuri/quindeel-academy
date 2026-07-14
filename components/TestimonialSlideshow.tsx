"use client";

import { useEffect, useState } from "react";

type Item = { id: string; quote: string; author: string; role: string; photo?: string };

// Auto-cycling testimonial on the home page (~6s each). Read-only — the teacher
// edits testimonials on the /testimonials page; this just features them. Mirrors
// the GallerySlideshow fade pattern.
export function TestimonialSlideshow({ items }: { items: Item[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const cur = items[i];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card relative p-8 text-center sm:p-10">
        <p className="text-5xl leading-none text-brand/25">“</p>
        <p
          key={cur.id}
          className="-mt-4 whitespace-pre-wrap break-words text-lg italic leading-relaxed text-slate-700"
        >
          {cur.quote}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
          {cur.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cur.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200" />
          )}
          <div>
            <p className="font-bold text-brand-dark">{cur.author}</p>
            {cur.role && <p className="text-sm text-slate-500">{cur.role}</p>}
          </div>
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Testimonial ${idx + 1}`}
              onClick={() => setI(idx)}
              className={
                "h-2 w-2 rounded-full transition " + (idx === i ? "bg-brand" : "bg-slate-300 hover:bg-slate-400")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
