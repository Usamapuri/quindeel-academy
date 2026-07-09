"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createMeetEvent, isGoogleConnected } from "@/lib/google";

export async function createClass(formData: FormData) {
  await requireRole("TEACHER");
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim();
  const startsRaw = String(formData.get("startsAt") || "").trim();
  const durationMins = parseInt(String(formData.get("durationMins") || "60"), 10) || 60;
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const descriptionUr = String(formData.get("descriptionUr") || "").trim();
  let meetingLink = String(formData.get("meetingLink") || "").trim();

  if (!courseId || !title || !startsRaw) return;
  const startsAt = new Date(startsRaw);
  if (isNaN(startsAt.getTime())) return;

  let googleEventId: string | null = null;

  // If Google is connected and no manual link was given, auto-create a Meet link.
  if (!meetingLink && (await isGoogleConnected())) {
    try {
      const attendees = await prisma.enrollment.findMany({
        where: { courseId },
        select: { student: { select: { email: true } } },
      });
      const result = await createMeetEvent({
        title,
        description: descriptionEn || descriptionUr,
        startsAt,
        durationMins,
        attendeeEmails: attendees.map((a) => a.student.email).filter(Boolean),
      });
      meetingLink = result.meetingLink;
      googleEventId = result.eventId;
    } catch (e) {
      console.error("Google Meet creation failed, falling back to manual link:", e);
    }
  }

  // A class must have a meeting link — pasted, or auto-created above. It must be a
  // real http(s) URL (blocks junk like "or a"). No valid link → no class.
  if (!meetingLink) return;
  try {
    const u = new URL(meetingLink);
    if (u.protocol !== "http:" && u.protocol !== "https:") return;
  } catch {
    return;
  }

  await prisma.classSession.create({
    data: { courseId, title, startsAt, durationMins, descriptionEn, descriptionUr, meetingLink, googleEventId },
  });
  revalidatePath("/admin/live");
}

export async function deleteClass(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  await prisma.classSession.delete({ where: { id } });
  revalidatePath("/admin/live");
}
