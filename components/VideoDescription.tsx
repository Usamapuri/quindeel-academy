"use client";

import { useState } from "react";
import { useEdit } from "./EditProvider";
import { Editable } from "./Editable";

// A long description collapses to 3 lines with a "See more" toggle so it never
// eats the screen. The teacher keeps it inline-editable — clicking into the text
// auto-expands it (via onFocusCapture) so they always edit the full description.
export function VideoDescription({
  videoId,
  description,
  lang = "en",
}: {
  videoId: string;
  description: string;
  lang?: "en" | "ur";
}) {
  const { canEdit } = useEdit();
  const ur = lang === "ur";
  const [open, setOpen] = useState(false);
  const long = description.length > 160;
  const clamp = long && !open ? "line-clamp-3" : "";

  const toggle = long ? (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="mt-0.5 text-xs font-semibold text-brand hover:underline"
    >
      {open ? (ur ? "کم دیکھیں" : "See less") : (ur ? "مزید دیکھیں" : "See more")}
    </button>
  ) : null;

  if (canEdit) {
    return (
      <div className="mt-1 text-sm text-slate-600" onFocusCapture={() => setOpen(true)}>
        <Editable
          field={`video:${videoId}:description`}
          value={description}
          as="p"
          multiline
          className={"whitespace-pre-wrap break-words " + clamp}
          placeholder={ur ? "تفصیل شامل کریں…" : "Add a description…"}
        />
        {toggle}
      </div>
    );
  }

  if (!description) return null;

  return (
    <div className="mt-1 text-sm text-slate-600">
      <p className={"whitespace-pre-wrap break-words " + clamp}>{description}</p>
      {toggle}
    </div>
  );
}
