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

// Editable BlogPost columns (whitelist). `image` holds an optional data-URL cover.
const BLOG_COLS = new Set(["titleEn", "titleUr", "bodyEn", "bodyUr", "image"]);

// Editable Video columns (whitelist) — just the teacher's description.
const VIDEO_COLS = new Set(["description"]);

// Editable Testimonial columns (whitelist).
const TESTIMONIAL_COLS = new Set(["author", "role", "quote"]);

// Editable Faculty / FacultyCategory columns (whitelist).
const FACULTY_COLS = new Set(["nameEn", "nameUr", "shortEn", "shortUr", "bioEn", "bioUr", "photo"]);
const FACULTY_CAT_COLS = new Set(["nameEn", "nameUr"]);

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
  } else if (field.startsWith("blog:")) {
    const [, id, col] = field.split(":");
    if (!id || !BLOG_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.blogPost.update({ where: { id }, data: { [col]: clean } });
  } else if (field.startsWith("video:")) {
    const [, id, col] = field.split(":");
    if (!id || !VIDEO_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.video.update({ where: { id }, data: { [col]: clean } });
  } else if (field.startsWith("testimonial:")) {
    const [, id, col] = field.split(":");
    if (!id || !TESTIMONIAL_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.testimonial.update({ where: { id }, data: { [col]: clean } });
  } else if (field.startsWith("facultycat:")) {
    const [, id, col] = field.split(":");
    if (!id || !FACULTY_CAT_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.facultyCategory.update({ where: { id }, data: { [col]: clean } });
  } else if (field.startsWith("faculty:")) {
    const [, id, col] = field.split(":");
    if (!id || !FACULTY_COLS.has(col)) return { ok: false, error: "bad field" };
    await prisma.faculty.update({ where: { id }, data: { [col]: clean } });
  } else {
    return { ok: false, error: "unknown field" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
