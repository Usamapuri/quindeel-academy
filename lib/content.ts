import { prisma } from "./db";
import type { Lang } from "./i18n";

/** Load all editable site settings as a plain record. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany();
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/** Build the SiteSetting key for a bilingual base (e.g. "heroTagline" + ur → "heroTaglineUr"). */
export function settingKey(base: string, lang: Lang): string {
  return base + (lang === "ur" ? "Ur" : "En");
}
