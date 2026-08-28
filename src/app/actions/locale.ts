"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, localeCookieName } from "@/lib/i18n";

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) return;
  (await cookies()).set(localeCookieName, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
