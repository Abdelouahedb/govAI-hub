import "server-only";

import { cookies } from "next/headers";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const localeCookieName = "govai-locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value;
  return value && isLocale(value) ? value : defaultLocale;
}

/** Keep French first in each call to make it the clear product language. */
export function tr(locale: Locale, french: string, english: string) {
  return locale === "fr" ? french : english;
}
