import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { RiskAssessmentForm } from "@/components/risk-assessment-form";
import { requirePermission } from "@/lib/auth/permissions";
import { getSystemById } from "@/lib/data/systems";
import { getLocale, tr } from "@/lib/i18n";

const defaultAnswers = { usesSensitiveData: false, affectsIndividuals: false, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: false, lacksAppeal: false, lacksDataGovernance: false, lacksBiasTesting: false, lacksSecurityControls: false, lacksMonitoringPlan: false };

function answersFromAssessment(answers: unknown) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return defaultAnswers;
  const record = answers as Record<string, unknown>;
  return Object.fromEntries(Object.keys(defaultAnswers).map((key) => [key, record[key] === true])) as typeof defaultAnswers;
}

export default async function RiskAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("assessment:complete");
  const { id } = await params;
  const system = await getSystemById(id);
  if (!system || (actor.role !== "ADMINISTRATOR" && system.ownerId !== actor.id)) notFound();
  const locale = await getLocale();

  return <section className="app-page narrow-page"><Link href={`/systems/${system.id}`} className="back-button"><ArrowLeft size={16} /> {tr(locale, `Retour à ${system.name}`, `Back to ${system.name}`)}</Link><header className="page-heading"><p className="eyebrow">{tr(locale, "ÉVALUATION DES RISQUES", "RISK ASSESSMENT")} · {system.referenceId}</p><h1>{tr(locale, "Évaluer le risque du système", "Assess system risk")}</h1><p>{tr(locale, "Enregistrez des faits de risque structurés. GovAI Hub applique les règles publiées et sauvegarde une évaluation versionnée.", "Record structured risk facts. GovAI Hub applies published rules and saves a versioned assessment.")}</p></header><RiskAssessmentForm locale={locale} systemId={system.id} systemName={system.name} defaultValues={answersFromAssessment(system.riskAssessments[0]?.answers)} /></section>;
}
