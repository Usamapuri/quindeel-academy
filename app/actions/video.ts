"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { youtubeId } from "@/lib/youtube";

export type VideoState = { ok?: boolean; error?: string };

// Teacher pastes a YouTube link. We parse the id, fetch the title once from
// YouTube's free public oEmbed endpoint (no API key), and store it.
// Keep only the ids that are real courses.
async function validCourseIds(raw: string[]): Promise<string[]> {
  const ids = [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0) return [];
  const found = await prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return found.map((c) => c.id);
}

export async function addVideo(_prev: VideoState, formData: FormData): Promise<VideoState> {
  await requireRole("TEACHER");
  const url = String(formData.get("url") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const courseIds = await validCourseIds(formData.getAll("courseId").map(String));
  const videoId = youtubeId(url);
  if (!videoId) return { error: "Please paste a valid YouTube link." };

  let title = "";
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { cache: "no-store" },
    );
    if (res.ok) title = (await res.json())?.title ?? "";
  } catch {
    /* title is best-effort — the thumbnail still works from the id */
  }

  await prisma.video.create({
    data: { url, videoId, title, description, courses: { connect: courseIds.map((id) => ({ id })) } },
  });
  revalidatePath("/videos");
  return { ok: true };
}

// Toggle whether a video is a lecture in a given course (connect/disconnect). A
// video can belong to several courses at once; no courses = public.
export async function toggleVideoCourse(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  const courseId = String(formData.get("courseId") || "");
  const on = String(formData.get("on") || "") === "true";
  if (!id || !courseId) return;
  if (on) {
    const valid = await validCourseIds([courseId]);
    if (valid.length === 0) return;
  }
  await prisma.video.update({
    where: { id },
    data: { courses: on ? { connect: { id: courseId } } : { disconnect: { id: courseId } } },
  });
  revalidatePath("/videos");
}

export async function deleteVideo(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.video.deleteMany({ where: { id } });
  revalidatePath("/videos");
}
