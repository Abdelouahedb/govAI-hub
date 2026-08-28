import { UserCreateForm } from "@/components/user-create-form";
import { UserDirectory } from "@/components/user-directory";
import { requirePermission } from "@/lib/auth/permissions";
import { getDepartments, getUsersForAdministration } from "@/lib/data/admin";
import { getLocale, tr } from "@/lib/i18n";

export default async function UsersPage() {
  await requirePermission("users:manage");
  const [departments, users, locale] = await Promise.all([getDepartments(), getUsersForAdministration(), getLocale()]);

  return (
    <section className="app-page users-page">
      <header className="page-heading"><div><p className="eyebrow">{tr(locale, "ADMINISTRATION", "ADMINISTRATION")}</p><h1>{tr(locale, "Personnes et accès", "People and access")}</h1><p>{tr(locale, "Attribuez les responsabilités de gouvernance, maintenez les informations de compte à jour et retirez les accès lorsqu’ils ne sont plus nécessaires.", "Assign governance responsibilities, keep account details current, and remove access when it is no longer needed.")}</p></div></header>
      <div className="users-workspace">
        <aside className="user-create-panel"><div><h2>{tr(locale, "Ajouter une personne", "Add a person")}</h2><p>{tr(locale, "Créez un compte uniquement lorsqu’une personne nommée a besoin d’accéder à un flux de gouvernance.", "Create an account only when a named person needs access to a governance workflow.")}</p></div><UserCreateForm departments={departments} locale={locale} /></aside>
        <UserDirectory departments={departments} users={users} locale={locale} />
      </div>
    </section>
  );
}
