"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { youtubeId } from "@/lib/youtube";

export type VideoState = { ok?: boolean; error?: string };

// Teacher pastes a YouTube link. We parse the id, fetch the title once from
// YouTube's free public oEmbed endpoint (no API key), and store it.
export async function addVideo(_prev: VideoState, formData: FormData): Promise<VideoState> {
  await requireRole("TEACHER");
  const url = String(formData.get("url") || "").trim();
  const description = String(formData.get("description") || "").trim();
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

  await prisma.video.create({ data: { url, videoId, title, description } });
  revalidatePath("/videos");
  return { ok: true };
}

export async function deleteVideo(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.video.deleteMany({ where: { id } });
  revalidatePath("/videos");
}
