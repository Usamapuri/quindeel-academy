"use client";

// Triggers the browser's print dialog, where the user chooses "Save as PDF".
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      {label}
    </button>
  );
}
