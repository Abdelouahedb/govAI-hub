import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardText, ShieldWarning, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/roles";
import { getSystemById } from "@/lib/data/systems";
import { getStatusDetails, readableEnum } from "@/lib/governance-status";
import { getLocale, tr } from "@/lib/i18n";
import { CorrectiveActionForm } from "@/components/corrective-action-form";
import { IncidentReportForm } from "@/components/incident-report-form";
import { IncidentUpdateForm } from "@/components/incident-update-form";

export default async function SystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireUser();
  if (!hasPermission(actor.role, "registry:view")) notFound();
  const { id } = await params;
  const system = await getSystemById(id);
  if (!system) notFound();

  const assessment = system.riskAssessments[0];
  const audit = system.complianceAudits[0];
  const decision = system.governanceDecisions[0];
  const locale = await getLocale();
  const status = getStatusDetails(system.status, locale);
  const openActions = system.correctiveActions.filter((action) => action.status !== "COMPLETED");
  const currentAction = openActions[0];
  const canUpdateAction = (action: { assigneeId: string | null }) => actor.role === "ADMINISTRATOR" || action.assigneeId === actor.id;
  const canAuditControls = hasPermission(actor.role, "compliance:audit");

  return (
    <section className="app-page system-workspace">
      <div className="workspace-utility-row">
        <Link href="/systems" className="back-button"><ArrowLeft size={16} /> {tr(locale, "Retour au registre", "Back to registry")}</Link>
        <span className="workspace-reference">{system.referenceId}</span>
      </div>

      <header className="system-workspace-header">
        <div className="system-workspace-title">
          <p className="eyebrow">{system.department.name} · {readableEnum(system.lifecycleStage, locale)}</p>
          <h1>{system.name}</h1>
          <p>{system.description}</p>
        </div>
        <div className="system-workspace-actions" aria-label={tr(locale, "Actions du système", "System actions")}>
          {hasPermission(actor.role, "assessment:complete") && (actor.role === "ADMINISTRATOR" || actor.id === system.ownerId) && <Link className="secondary-button" href={`/systems/${system.id}/assessment`}>{assessment ? tr(locale, "Réévaluer le risque", "Reassess risk") : tr(locale, "Commencer l’évaluation", "Start risk assessment")}</Link>}
          {canAuditControls && system.recommendedControls.length > 0 && <Link className="secondary-button" href={`/systems/${system.id}/audit`}>{tr(locale, "Auditer les contrôles", "Audit controls")}</Link>}
          {hasPermission(actor.role, "decision:record") && <Link className="primary-button" href={`/systems/${system.id}/decision`}>{tr(locale, "Enregistrer une décision", "Record decision")}</Link>}
        </div>
      </header>

      <section className={`decision-readiness-strip ${status.tone}`} aria-labelledby="readiness-heading">
        <div className="readiness-primary">
          <p className="readiness-label">{tr(locale, "Décision de gouvernance", "Governance decision")}</p>
          <div className="readiness-title-row"><h2 id="readiness-heading">{status.label}</h2>{currentAction ? <Link className="text-button" href="#corrective-actions">{tr(locale, "Voir l’action", "View action")} <ArrowRight size={15} /></Link> : <span className="readiness-complete"><CheckCircle size={15} weight="fill" /> {tr(locale, "Actions à jour", "Actions up to date")}</span>}</div>
          <p>{status.description}</p>
        </div>
        <dl className="readiness-facts">
          <div><dt>{tr(locale, "Risque", "Risk")}</dt><dd className={`risk-value ${system.riskLevel.toLowerCase()}`}>{system.riskScore}/100 <span>{system.riskLevel}</span></dd></div>
          <div><dt>{tr(locale, "Conformité", "Compliance")}</dt><dd>{audit ? `${audit.score ?? 0}/100` : "—"} <span>{audit ? tr(locale, "audit le plus récent", "latest audit") : tr(locale, "aucun audit", "no audit")}</span></dd></div>
          <div><dt>{tr(locale, "Surveillance", "Monitoring")}</dt><dd>{system.incidents.length ? `${system.incidents.length} ${tr(locale, "incident", "incident")}` : tr(locale, "Aucun incident", "No incidents")} <span>{system.incidents.length ? tr(locale, "à suivre", "to monitor") : tr(locale, "déclaré", "reported")}</span></dd></div>
        </dl>
      </section>

      <div className="workspace-overview-grid">
        <section className="workspace-panel accountability-panel" aria-labelledby="accountability-heading">
          <div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Propriétaire humain", "Human ownership")}</p><h2 id="accountability-heading">{tr(locale, "Responsabilités", "Accountability")}</h2></div><UserCircle size={28} /></div>
          <dl>
            <div><dt>{tr(locale, "Responsable", "Owner")}</dt><dd>{system.owner.name}</dd></div>
            <div><dt>{tr(locale, "Autonomie", "Autonomy")}</dt><dd>{readableEnum(system.autonomyLevel, locale)}</dd></div>
            <div><dt>{tr(locale, "Utilisateurs", "Users")}</dt><dd>{system.intendedUsers}</dd></div>
            <div><dt>{tr(locale, "Données", "Data")}</dt><dd>{system.dataCategories.length} {tr(locale, "catégories", "categories")}</dd></div>
          </dl>
        </section>

        <section className="workspace-panel evidence-panel" aria-labelledby="evidence-heading">
          <div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Preuves et contrôles", "Evidence and controls")}</p><h2 id="evidence-heading">{tr(locale, "Signal de risque", "Risk signal")}</h2></div><span className={`risk-chip ${system.riskLevel.toLowerCase()}`}>{system.riskScore}/100 {system.riskLevel}</span></div>
          {assessment ? <div className="risk-factor-list">{assessment.triggeredFactors.map((factor) => <div key={factor.id}><strong>{factor.label}</strong><span>+{factor.points}</span></div>)}</div> : <div className="empty-inline"><ShieldWarning size={21} /> {tr(locale, "Aucune évaluation soumise.", "No assessment submitted yet.")}</div>}
          <div className="evidence-footer"><span>{system.recommendedControls.length} {tr(locale, "contrôles recommandés", "recommended controls")}</span>{canAuditControls && <Link href={`/systems/${system.id}/audit`} className="text-button">{tr(locale, "Voir les contrôles", "View controls")} <ArrowRight size={15} /></Link>}</div>
        </section>

        <section className="workspace-panel purpose-panel" aria-labelledby="purpose-heading">
          <p className="eyebrow">{tr(locale, "Contexte d’utilisation", "Use context")}</p><h2 id="purpose-heading">{tr(locale, "Objectif du système", "System purpose")}</h2><p>{system.purpose}</p>
          <details><summary>{tr(locale, "Voir les catégories de données", "View data categories")}</summary><ul>{system.dataCategories.map((category) => <li key={category}>{category}</li>)}</ul></details>
        </section>
      </div>

      <section className="workspace-panel decision-record" aria-labelledby="decision-heading">
        <div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Décision humaine", "Human decision")}</p><h2 id="decision-heading">{tr(locale, "Dossier de décision", "Decision record")}</h2></div></div>
        {decision ? <div className="decision-record-body"><span className="status-chip decision-chip">{decision.decision.replaceAll("_", " ")}</span><p className="decision-approver">{decision.approver.name}</p><p>{decision.justification}</p>{decision.conditions && <div className="decision-conditions"><strong>{tr(locale, "Conditions", "Conditions")}</strong><p>{decision.conditions}</p></div>}</div> : <div className="empty-inline"><ClipboardText size={21} /> {tr(locale, "Aucune décision enregistrée.", "No decision recorded.")}</div>}
        {hasPermission(actor.role, "decision:record") && <Link href={`/systems/${system.id}/decision`} className="secondary-button decision-link">{decision ? tr(locale, "Voir ou remplacer", "View or replace") : tr(locale, "Enregistrer une décision", "Record a decision")}</Link>}
      </section>

      <section className="workspace-panel corrective-ledger" id="corrective-actions" aria-labelledby="actions-heading">
          <div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Suivi de résolution", "Resolution tracking")}</p><h2 id="actions-heading">{tr(locale, "Actions correctives", "Corrective actions")}</h2><p>{openActions.length ? tr(locale, `${openActions.length} action(s) demandent encore une preuve ou une validation.`, `${openActions.length} action(s) still need evidence or verification.`) : tr(locale, "Les actions correctives sont à jour.", "Corrective actions are up to date.")}</p></div>{canAuditControls && <Link className="text-button" href={`/systems/${system.id}/audit`}>{tr(locale, "Auditer", "Audit")} <ArrowRight size={15} /></Link>}</div>
          {system.correctiveActions.length ? <div className="action-ledger-list">{system.correctiveActions.map((action, index) => <article className="action-ledger-row" key={action.id}>
            <div className="action-sequence" aria-hidden="true">{index + 1}</div>
            <div className="action-main"><strong>{action.title}</strong><p>{action.description}</p>{action.evidenceNote && <p className="action-evidence"><b>{tr(locale, "Preuve :", "Evidence:")}</b> {action.evidenceNote}</p>}</div>
            <div className="action-meta"><span className={`status-chip ${action.status.toLowerCase()}`}>{action.status.replaceAll("_", " ")}</span><small>{action.assignee?.name ?? tr(locale, "Non attribuée", "Unassigned")}</small></div>
            {canUpdateAction(action) && <details className="action-update-details"><summary>{tr(locale, "Mettre à jour", "Update")}</summary><CorrectiveActionForm action={action} /></details>}
          </article>)}</div> : <div className="empty-inline"><ClipboardText size={21} /> {tr(locale, "Aucune action corrective.", "No corrective actions.")}</div>}
      </section>

      <section className="workspace-panel incidents-panel" aria-labelledby="incidents-heading">
        <div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Surveillance", "Monitoring")}</p><h2 id="incidents-heading">{tr(locale, "Incidents", "Incidents")}</h2><p>{system.incidents.length ? tr(locale, `${system.incidents.length} incident(s) sont enregistrés pour ce système.`, `${system.incidents.length} incident(s) are recorded for this system.`) : tr(locale, "Aucun incident déclaré.", "No incidents reported.")}</p></div></div>
        {system.incidents.length ? <div className="incident-summary-list">{system.incidents.map((incident) => <details key={incident.id}><summary><span><strong>{incident.title}</strong><small>{tr(locale, "Déclaré par", "Reported by")} {incident.reporter.name} · {incident.reportedAt.toLocaleDateString()}</small></span><span className="status-chip">{incident.severity} · {incident.status}</span></summary><div className="incident-details"><p>{incident.description}</p>{incident.resolutionNote && <p><strong>{tr(locale, "Suivi :", "Follow-up:")}</strong> {incident.resolutionNote}</p>}{hasPermission(actor.role, "incidents:update") && <IncidentUpdateForm incident={incident} />}</div></details>)}</div> : null}
        {hasPermission(actor.role, "incidents:report") && (actor.role !== "AI_SYSTEM_OWNER" || actor.id === system.ownerId) && <details className="incident-report-details"><summary>{tr(locale, "Déclarer un incident", "Report an incident")}</summary><IncidentReportForm aiSystemId={system.id} /></details>}
      </section>

      <section className="workspace-panel activity-card workspace-timeline"><div className="panel-heading"><div><p className="eyebrow">{tr(locale, "Traçabilité", "Traceability")}</p><h2>{tr(locale, "Chronologie de gouvernance", "Governance timeline")}</h2><p>{tr(locale, "Chaque changement relie une personne, une action et une date.", "Each change links a person, an action, and a date.")}</p></div></div>{system.auditEvents.length ? <details className="timeline-details"><summary>{tr(locale, `Voir les ${system.auditEvents.length} événements`, `View ${system.auditEvents.length} events`)}</summary><ol>{system.auditEvents.map((event) => <li key={event.id}><div><strong>{event.summary}</strong><span>{event.actor?.name ?? tr(locale, "Système", "System")} · {readableEnum(event.eventType, locale)}</span></div><time>{event.occurredAt.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}</time></li>)}</ol></details> : <div className="empty-inline"><ClipboardText size={21} /> {tr(locale, "Aucun événement de gouvernance n’a encore été enregistré.", "No governance events have been recorded yet.")}</div>}</section>
    </section>
  );
}
