"use client";

import { ReactNode } from "react";
import { useLang } from "./LangProvider";

type Action = (formData: FormData) => void | Promise<void>;

// A delete/destructive submit button that asks for confirmation first, so a
// misclick can't irreversibly remove data. `fields` become hidden inputs on the
// form; `message` is shown in the browser confirm dialog.
export default function ConfirmDeleteButton({
  action,
  fields,
  message,
  className = "rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-600",
  children,
}: {
  action: Action;
  fields: Record<string, string>;
  message: string;
  className?: string;
  children?: ReactNode;
}) {
  const { lang } = useLang();
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button className={className}>{children ?? (lang === "ur" ? "حذف کریں" : "Delete")}</button>
    </form>
  );
}
