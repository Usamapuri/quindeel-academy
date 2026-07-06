"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getAuthUrl, disconnectGoogle } from "@/lib/google";

export async function startGoogleConnect() {
  await requireRole("TEACHER");
  redirect(getAuthUrl());
}

export async function disconnectGoogleAction() {
  await requireRole("TEACHER");
  await disconnectGoogle();
  revalidatePath("/admin/google");
}
