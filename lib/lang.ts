import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./i18n";

/** Read the current UI language from the cookie (server-side). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "ur" ? "ur" : "en";
}
