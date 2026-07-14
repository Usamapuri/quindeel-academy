"use client";

import { useState, useTransition, type ElementType } from "react";
import { useEdit } from "./EditProvider";
import { saveContent } from "@/app/actions/content";

type Props = {
  /** "setting:<key>" or "course:<id>:<column>" */
  field: string;
  value: string;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
};

/**
 * WordPress-but-simpler inline editing. For a logged-in teacher this renders editable text:
 * hover highlights it, click to type, blur saves and publishes. For everyone else it's plain text.
 */
export function Editable({
  field,
  value,
  as,
  className = "",
  multiline = false,
  placeholder = "…",
}: Props) {
  const { canEdit } = useEdit();
  const Tag: ElementType = as || (multiline ? "p" : "span");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [, startTransition] = useTransition();

  if (!canEdit) {
    return <Tag className={className}>{value || ""}</Tag>;
  }

  function commit(text: string) {
    const next = text.replace(/ /g, " ").trim();
    if (next === value) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await saveContent(field, next);
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) setTimeout(() => setStatus("idle"), 1500);
    });
  }

  const isBlock = as === "h1" || as === "h2" || as === "h3" || as === "h4" || as === "h5" || as === "h6" || as === "p" || as === "div" || (!as && multiline);
  const wrapperClass = `group/edit relative max-w-full ${isBlock ? "block" : "inline-block align-baseline"}`;

  return (
    <span className={wrapperClass}>
      <Tag
        contentEditable
        suppressContentEditableWarning
        dir="auto"
        data-placeholder={placeholder}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => commit(e.currentTarget.textContent ?? "")}
        className={
          `${className} ${multiline ? "whitespace-pre-wrap" : ""} ` +
          "cursor-text rounded-md outline-none transition " +
          "ring-2 ring-transparent ring-offset-2 ring-offset-transparent " +
          "hover:ring-amber-400/70 focus:ring-amber-500 " +
          "empty:before:content-[attr(data-placeholder)] empty:before:text-amber-500/60"
        }
        title="Click to edit"
      >
        {value}
      </Tag>
      {status !== "idle" && (
        <span
          className={
            "pointer-events-none absolute -top-6 left-0 z-20 rounded px-2 py-0.5 text-xs font-medium shadow " +
            (status === "saving" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white")
          }
        >
          {status === "saving" ? "Saving…" : "✓ Saved"}
        </span>
      )}
    </span>
  );
}
