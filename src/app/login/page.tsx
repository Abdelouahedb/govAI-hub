import { redirect } from "next/navigation";
import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getLocale, tr } from "@/lib/i18n";

export const metadata = { title: "GovAI Hub" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const locale = await getLocale();
  return <main className="login-page"><section className="login-introduction"><div className="login-topline"><a className="login-brand" href="/login" aria-label="GovAI Hub"><Image alt="" className="login-brand-image" height={80} priority src="/govai-hub-logo.png" width={200} /></a><LanguageSwitcher locale={locale} /></div><div><p className="login-eyebrow">{tr(locale, "Espace de gouvernance de l’IA", "AI governance workspace")}</p><h1>{tr(locale, "Les décisions humaines ont besoin de preuves visibles.", "Human decisions need visible evidence.")}</h1><p>{tr(locale, "Examinez les risques des systèmes d’IA, la couverture des contrôles, les actions correctives et les décisions de gouvernance dans un espace traçable.", "Review AI-system risk, control coverage, corrective actions, and governance decisions in one traceable workspace.")}</p></div><aside className="login-evidence-flow"><p>{tr(locale, "Une trace claire de l’évaluation à la décision.", "A clear trace from assessment to decision.")}</p></aside></section><section className="login-panel" aria-labelledby="login-title"><div className="login-panel-inner"><p className="login-step">{tr(locale, "Accès sécurisé", "Secure workspace access")}</p><h2 id="login-title">{tr(locale, "Connexion", "Sign in")}</h2><p>{tr(locale, "Utilisez votre compte attribué pour accéder aux fonctions autorisées pour votre rôle.", "Use your assigned account to access the controls available to your role.")}</p><LoginForm locale={locale} /></div></section></main>;
}
