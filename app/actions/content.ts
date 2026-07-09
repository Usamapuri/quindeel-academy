"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Editable Course text columns (whitelist — never trust the client with a column name).
const COURSE_COLS = new Set([
  "titleEn",
  "titleUr",
  "summaryEn",
  "summaryUr",
  "descriptionEn",
  "descriptionUr",
  "descriptionImages", // JSON array of positioned images shown under the description
  "feeText",
]);

export type SaveResult = { ok: boolean; error?: string };

/**
 * Persist an inline edit. `field` encodes the target:
 *   - "setting:<key>"          → SiteSetting key/value
 *   - "course:<id>:<column>"   → a whitelisted Course text column
 * Only a logged-in TEACHER may save. Saving publishes immediately.
 */
export async function saveContent(field: string, value: string): Promise<SaveResult> {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return { ok: false, error: "unauthorized" };

  const clean = value.replace(/ /g, " ").trim();

  if (field.startsWith("setting:")) {
    const key = field.slice("setting:".length);
    if (!key) return { ok: false, error: "bad key" };
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: clean },
      create: { key, value: clean },
    });
  } else if (field.startsWith("course:")) {
    const [, id, col] = field.split(":");
    if (!id || !COURSE_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.course.update({ where: { id }, data: { [col]: clean } });
  } else {
    return { ok: false, error: "unknown field" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
