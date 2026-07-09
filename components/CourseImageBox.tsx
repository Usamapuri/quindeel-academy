"use client";

import { useRef, useState, useTransition } from "react";
import { useEdit } from "./EditProvider";
import { saveContent } from "@/app/actions/content";

type Img = { id: string; src: string; x: number; y: number; w: number }; // x/y/w in % of box

function parse(json: string): Img[] {
  try {
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter((i) => i && typeof i.src === "string");
  } catch {
    return [];
  }
}

// Downscale a picked file to a data URL small enough to store inline.
function fileToDataUrl(file: File, maxDim = 900): Promise<string> {
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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// A box below the course description where the teacher places images by dragging.
// Students (and visitors) see the images exactly as positioned, read-only.
export default function CourseImageBox({
  courseId,
  initial,
  lang = "en",
}: {
  courseId: string;
  initial: string;
  lang?: "en" | "ur";
}) {
  const { canEdit } = useEdit();
  const ur = lang === "ur";
  const [images, setImages] = useState<Img[]>(() => parse(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; offX: number; offY: number } | null>(null);

  // Visitors with no images: render nothing at all.
  if (!canEdit && images.length === 0) return null;

  function persist(next: Img[]) {
    setImages(next);
    setStatus("saving");
    startTransition(async () => {
      const res = await saveContent(`course:${courseId}:descriptionImages`, JSON.stringify(next));
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) setTimeout(() => setStatus("idle"), 1200);
    });
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added: Img[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const src = await fileToDataUrl(file);
        added.push({ id: crypto.randomUUID(), src, x: 6 + added.length * 4, y: 6 + added.length * 4, w: 40 });
      } catch {
        /* skip unreadable file */
      }
    }
    if (added.length) persist([...images, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onPointerDown(e: React.PointerEvent, im: Img) {
    if (!canEdit) return;
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const imgLeft = (im.x / 100) * box.width;
    const imgTop = (im.y / 100) * box.height;
    drag.current = { id: im.id, offX: e.clientX - box.left - imgLeft, offY: e.clientY - box.top - imgTop };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const im = images.find((i) => i.id === d.id);
    if (!im) return;
    const xPct = ((e.clientX - box.left - d.offX) / box.width) * 100;
    const yPct = ((e.clientY - box.top - d.offY) / box.height) * 100;
    setImages((prev) =>
      prev.map((i) =>
        i.id === d.id ? { ...i, x: clamp(xPct, 0, 100 - i.w), y: clamp(yPct, 0, 96) } : i,
      ),
    );
  }

  function onPointerUp() {
    if (drag.current) {
      drag.current = null;
      persist(images); // save the final position
    }
  }

  function remove(id: string) {
    persist(images.filter((i) => i.id !== id));
  }

  function resize(id: string, dir: 1 | -1) {
    persist(images.map((i) => (i.id === id ? { ...i, w: clamp(i.w + dir * 10, 15, 90) } : i)));
  }

  return (
    <div className="relative mt-6">
      {canEdit && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            🖼️ {ur ? "تصویر شامل کریں" : "Insert picture"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <span className="text-xs text-slate-400">
            {ur ? "تصویروں کو کھینچ کر کہیں بھی رکھیں" : "Drag pictures anywhere in the box"}
          </span>
          {status !== "idle" && (
            <span className={"rounded px-2 py-0.5 text-xs font-medium text-white " + (status === "saving" ? "bg-amber-500" : "bg-emerald-600")}>
              {status === "saving" ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : ur ? "✓ محفوظ" : "✓ Saved"}
            </span>
          )}
        </div>
      )}

      <div
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={
          "relative min-h-[640px] w-full overflow-hidden rounded-2xl sm:min-h-[720px] " +
          (canEdit ? "border-2 border-dashed border-slate-300 bg-slate-50/60" : "border border-slate-200 bg-white")
        }
      >
        {canEdit && images.length === 0 && (
          <p className="absolute inset-0 grid place-items-center px-4 text-center text-sm text-slate-400">
            {ur ? "یہاں تصویریں شامل کریں — وہ اس خانے میں طلبہ کو دکھائی دیں گی" : "Add pictures here — they appear in this box for students"}
          </p>
        )}
        {images.map((im) => (
          <div
            key={im.id}
            onPointerDown={(e) => onPointerDown(e, im)}
            style={{ position: "absolute", left: `${im.x}%`, top: `${im.y}%`, width: `${im.w}%` }}
            className={"group/img select-none " + (canEdit ? "cursor-move" : "")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.src} alt="" draggable={false} className="w-full rounded-lg shadow-sm" />
            {canEdit && (
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover/img:opacity-100">
                <button type="button" onClick={() => resize(im.id, -1)} title="Smaller" className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80">−</button>
                <button type="button" onClick={() => resize(im.id, 1)} title="Bigger" className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80">+</button>
                <button type="button" onClick={() => remove(im.id)} title="Remove" className="grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs text-white hover:bg-red-700">×</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
