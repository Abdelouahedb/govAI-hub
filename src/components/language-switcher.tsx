import { setLocaleAction } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  return <form action={setLocaleAction} className="language-switcher" aria-label="Language selection"><button type="submit" name="locale" value="fr" className={locale === "fr" ? "active" : ""} aria-pressed={locale === "fr"}>FR</button><span aria-hidden="true">/</span><button type="submit" name="locale" value="en" className={locale === "en" ? "active" : ""} aria-pressed={locale === "en"}>EN</button></form>;
}
