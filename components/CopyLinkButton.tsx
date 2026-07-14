"use client";

import { useState } from "react";

// Shows a full shareable link plus a Copy button. The absolute URL is computed
// server-side (from the request host) and passed in, so there's no hydration
// mismatch and no effect.
export function CopyLinkButton({ url, lang = "en" }: { url: string; lang?: "en" | "ur" }) {
  const ur = lang === "ur";
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the teacher can still select the text manually */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {copied ? (ur ? "✓ کاپی ہو گیا" : "✓ Copied") : ur ? "کاپی کریں" : "Copy link"}
      </button>
    </div>
  );
}
