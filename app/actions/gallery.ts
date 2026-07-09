"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { cloudinary, cloudinaryConfigured, GALLERY_FOLDER } from "@/lib/cloudinary";

export type UploadSig = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

// The teacher's browser uploads directly to Cloudinary, so the file never routes
// through our server (handles big phone photos). We only sign the request here —
// the API secret stays server-side and is never sent to the browser.
export async function signUpload(): Promise<UploadSig | null> {
  await requireRole("TEACHER");
  if (!cloudinaryConfigured()) return null;
  const timestamp = Math.round(Date.now() / 1000);
  const folder = GALLERY_FOLDER;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    signature,
    folder,
  };
}

// Record a photo after the browser finished uploading it to Cloudinary.
export async function addPhoto(formData: FormData) {
  await requireRole("TEACHER");
  const url = String(formData.get("url") || "").trim();
  const publicId = String(formData.get("publicId") || "").trim();
  // Only accept a Cloudinary delivery URL (don't let arbitrary URLs in).
  if (!publicId || !/^https:\/\/res\.cloudinary\.com\//.test(url)) return;
  await prisma.photo.create({ data: { url, publicId } });
  revalidatePath("/gallery");
  revalidatePath("/", "layout");
}

export async function deletePhoto(formData: FormData) {
  await requireRole("TEACHER");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return;
  // Remove the bytes from Cloudinary too, then the DB row.
  if (cloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(photo.publicId);
    } catch {
      /* if Cloudinary delete fails, still remove our record */
    }
  }
  await prisma.photo.delete({ where: { id } });
  revalidatePath("/gallery");
  revalidatePath("/", "layout");
}
