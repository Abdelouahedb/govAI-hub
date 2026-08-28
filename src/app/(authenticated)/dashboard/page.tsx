import { ArrowRight, FilePdf, Siren, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { GovernanceDashboardCharts } from "@/components/governance-dashboard-charts";
import { requirePermission } from "@/lib/auth/permissions";
import { getGovernanceDashboard } from "@/lib/data/governance-dashboard";
import { getLocale, tr } from "@/lib/i18n";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");
  const [dashboard, locale] = await Promise.all([getGovernanceDashboard(), getLocale()]);
  const incident = dashboard.featuredIncident;
  const severityLabel = incident ? tr(locale, { LOW: "Faible", MEDIUM: "Moyenne", HIGH: "Élevée", CRITICAL: "Critique" }[incident.severity], incident.severity[0] + incident.severity.slice(1).toLowerCase()) : "";
  const statusLabel = incident ? tr(locale, incident.status === "OPEN" ? "Ouvert" : "En investigation", incident.status === "OPEN" ? "Open" : "Investigating") : "";

  return <section className="app-page dashboard-page">
    <header className="dashboard-heading">
      <div>
        <p className="eyebrow">{tr(locale, "Gouvernance du portefeuille", "Portfolio governance")}</p>
        <h1>{tr(locale, "Vue d’ensemble", "Overview")}</h1>
        <p>{tr(locale, "Commencez par les sujets qui appellent une décision, une investigation ou une relance.", "Start with the items that need a decision, investigation, or follow-up.")}</p>
      </div>
      <a className="secondary-button dashboard-report-link" href="/api/reports/governance"><FilePdf size={18} /> {tr(locale, "Exporter le rapport", "Export report")}</a>
    </header>

    <section className="dashboard-priority" aria-labelledby="priority-heading">
      <div className="dashboard-priority-intro">
        <div>
          <p className="dashboard-section-label">{tr(locale, "À traiter maintenant", "Needs attention")}</p>
          <h2 id="priority-heading">{dashboard.openIncidents > 0 ? tr(locale, `${dashboard.openIncidents} incident${dashboard.openIncidents > 1 ? "s" : ""} ouvert${dashboard.openIncidents > 1 ? "s" : ""}`, `${dashboard.openIncidents} open incident${dashboard.openIncidents > 1 ? "s" : ""}`) : tr(locale, "Aucun incident ouvert", "No open incidents")}</h2>
        </div>
        <p>{dashboard.openIncidents > 0 ? tr(locale, "La surveillance reste active jusqu’à la résolution documentée de chaque incident.", "Monitoring remains active until each incident has a documented resolution.") : tr(locale, "Aucun incident actif ne nécessite une investigation actuellement.", "No active incident currently requires investigation.")}</p>
      </div>

      {incident ? <article className="dashboard-incident">
        <div className="dashboard-incident-icon"><Siren size={22} weight="fill" /></div>
        <div className="dashboard-incident-copy">
          <div className="dashboard-incident-meta"><span>{severityLabel}</span><span>{statusLabel}</span><span>{incident.aiSystem.referenceId}</span></div>
          <h3>{incident.title}</h3>
          <p>{tr(locale, "Système concerné :", "Affected system:")} <strong>{incident.aiSystem.name}</strong> · {tr(locale, "survenu le", "occurred on")} {incident.occurredAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}</p>
        </div>
        <a className="dashboard-incident-link" href={`/systems/${incident.aiSystem.id}`}>
          {tr(locale, "Ouvrir le dossier", "Open record")} <ArrowRight size={16} />
        </a>
      </article> : <div className="dashboard-clear-state"><span aria-hidden="true">✓</span><p>{tr(locale, "Aucun incident ouvert dans le registre.", "No open incident in the registry.")}</p></div>}

      <dl className="dashboard-snapshot">
        <div><dt>{tr(locale, "Dossiers enregistrés", "Registered records")}</dt><dd>{dashboard.totalSystems}</dd></div>
        <div><dt>{tr(locale, "En attente de revue", "Awaiting review")}</dt><dd>{dashboard.pendingApprovals}</dd></div>
        <div className={dashboard.overdueActions > 0 ? "is-attention" : ""}><dt>{tr(locale, "Actions en retard", "Overdue actions")}</dt><dd>{dashboard.overdueActions}</dd></div>
      </dl>
    </section>

    <section className="dashboard-reading" aria-labelledby="reading-heading">
      <div className="dashboard-reading-heading"><p className="dashboard-section-label">{tr(locale, "Lecture du portefeuille", "Portfolio reading")}</p><h2 id="reading-heading">{tr(locale, "Où se situent les systèmes enregistrés", "Where registered systems stand")}</h2></div>
      <GovernanceDashboardCharts lifecycle={dashboard.lifecycle} risk={dashboard.risk} locale={locale} />
    </section>

    <aside className="dashboard-note"><WarningCircle size={20} weight="fill" /><p>{tr(locale, "Les indicateurs décrivent les données de GovAI Hub à l’instant de consultation. Ils soutiennent la gouvernance interne et ne constituent pas une certification ou une évaluation juridique.", "These indicators describe GovAI Hub data at the time of viewing. They support internal governance and are not certification or legal assessment.")}</p></aside>
  </section>;
}
