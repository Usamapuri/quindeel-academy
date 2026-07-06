"use client";

import Link from "next/link";
import { useEdit } from "./EditProvider";
import { useT } from "./LangProvider";

export function EditModeBar() {
  const { canEdit } = useEdit();
  const t = useT();
  if (!canEdit) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950">
      <span>✏️ {t("editbar.title")}</span>
      <Link href="/admin" className="rounded-full bg-amber-950 px-3 py-0.5 text-amber-50 hover:bg-black">
        {t("editbar.goAdmin")}
      </Link>
    </div>
  );
}
