import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { getRoleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/permissions";
import { getLocale, tr } from "@/lib/i18n";

export default async function ProfilePage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);

  return (
    <section className="app-page profile-page">
      <div className="page-heading"><div><p className="eyebrow">{tr(locale, "PARAMÈTRES DU COMPTE", "ACCOUNT SETTINGS")}</p><h1>{tr(locale, "Votre profil", "Your profile")}</h1><p>{tr(locale, "Gérez votre présentation dans l’espace de travail et maintenez vos informations de connexion à jour.", "Manage how you appear in the workspace and keep your sign-in credentials current.")}</p></div></div>
      <ProfileSettingsForm key={`${user.name}:${user.avatarDataUrl ?? ""}`} name={user.name} email={user.email} role={getRoleLabel(user.role, locale)} avatarDataUrl={user.avatarDataUrl} locale={locale} />
    </section>
  );
}
