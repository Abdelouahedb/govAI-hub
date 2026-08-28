import Link from "next/link";
import { Plus, ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { requirePermission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/roles";
import { getSystems } from "@/lib/data/systems";
import { getStatusDetails, readableEnum } from "@/lib/governance-status";
import { getLocale, tr } from "@/lib/i18n";

const riskTone = { LOW: "low", MODERATE: "moderate", HIGH: "high", CRITICAL: "critical" } as const;

export default async function SystemsPage() {
  const [user, systems] = await Promise.all([requirePermission("registry:view"), getSystems()]);
  const locale = await getLocale();

  return (
    <section className="app-page">
      <div className="page-heading">
        <div><p className="eyebrow">{tr(locale, "Registre des systèmes d’IA", "AI-system registry")}</p><h1>{tr(locale, "Systèmes sous gouvernance", "Systems under governance")}</h1><p>{tr(locale, "Enregistrez, évaluez et suivez l’historique de décision de chaque système d’IA concerné.", "Register, assess, and follow the decision history of every AI system in scope.")}</p></div>
        {hasPermission(user.role, "registry:create") && <Link href="/systems/new" className="primary-button"><Plus size={18} /> {tr(locale, "Enregistrer un système", "Register system")}</Link>}
      </div>
      <div className="registry-summary">
        <div><span>{tr(locale, "Systèmes enregistrés", "Registered systems")}</span><strong>{systems.length}</strong></div>
        <div><span>{tr(locale, "Risque élevé ou critique", "High or critical risk")}</span><strong>{systems.filter((system) => system.riskLevel === "HIGH" || system.riskLevel === "CRITICAL").length}</strong></div>
        <div><span>{tr(locale, "Dossiers brouillon", "Draft records")}</span><strong>{systems.filter((system) => system.status === "DRAFT").length}</strong></div>
      </div>
      {systems.length === 0 ? (
        <div className="empty-state"><ShieldWarning size={32} /><h2>{tr(locale, "Aucun système enregistré", "No systems registered yet")}</h2><p>{tr(locale, "Enregistrez le premier système d’IA pour commencer son dossier de gouvernance.", "Register the first AI system to start its governance record.")}</p></div>
      ) : (
        <div className="registry-table-wrap">
          <table className="registry-table">
            <thead><tr><th>{tr(locale, "Système", "System")}</th><th>{tr(locale, "Département", "Department")}</th><th>{tr(locale, "Responsable", "Owner")}</th><th>{tr(locale, "Cycle de vie", "Lifecycle")}</th><th>{tr(locale, "Risque", "Risk")}</th><th>{tr(locale, "Statut", "Status")}</th><th>{tr(locale, "Mis à jour", "Updated")}</th></tr></thead>
            <tbody>{systems.map((system) => <tr key={system.id}>
              <td><Link href={`/systems/${system.id}`}><strong>{system.name}</strong><small>{system.referenceId} · {system.purpose}</small></Link></td>
              <td>{system.department.name}</td><td>{system.owner.name}</td><td>{readableEnum(system.lifecycleStage, locale)}</td>
              <td><span className={`risk-chip ${riskTone[system.riskLevel]}`}>{system.riskScore}/100 {readableEnum(system.riskLevel, locale)}</span></td>
              <td><span className={`status-chip ${getStatusDetails(system.status, locale).tone}`} title={getStatusDetails(system.status, locale).description}>{getStatusDetails(system.status, locale).label}</span></td><td>{system.updatedAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
