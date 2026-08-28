import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { SystemRegistrationForm } from "@/components/system-registration-form";
import { requirePermission } from "@/lib/auth/permissions";
import { getDepartments } from "@/lib/data/admin";
import { getLocale, tr } from "@/lib/i18n";

export default async function NewSystemPage() {
  const [user, departments, locale] = await Promise.all([requirePermission("registry:create"), getDepartments(), getLocale()]);
  const canChooseDepartment = user.role === "ADMINISTRATOR";

  return (
    <section className="app-page narrow-page">
      <Link href="/systems" className="back-button"><ArrowLeft size={16} /> {tr(locale, "Retour au registre", "Back to registry")}</Link>
      <div className="page-heading compact"><div><p className="eyebrow">{tr(locale, "NOUVEAU DOSSIER DE GOUVERNANCE", "NEW GOVERNANCE RECORD")}</p><h1>{tr(locale, "Enregistrer un système d’IA", "Register an AI system")}</h1><p>{tr(locale, "Commencez avec un responsable, un objectif clair et les informations sur les données et les impacts nécessaires à l’évaluation des risques.", "Start with accountable ownership, clear purpose, and the data and impact information required for risk assessment.")}</p></div></div>
      <SystemRegistrationForm locale={locale} departments={departments} defaultDepartmentId={user.departmentId} canChooseDepartment={canChooseDepartment} />
    </section>
  );
}
