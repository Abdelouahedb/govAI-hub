import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { GovernanceDecisionForm } from "@/components/governance-decision-form";
import { requirePermission } from "@/lib/auth/permissions";
import { getSystemById } from "@/lib/data/systems";
export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("decision:record"); const { id } = await params; const system = await getSystemById(id); if (!system) notFound(); const openActions = system.correctiveActions.filter((action) => ["OPEN", "IN_PROGRESS", "BLOCKED"].includes(action.status)).length; return <section className="app-page narrow-page"><Link href={`/systems/${system.id}`} className="back-button"><ArrowLeft size={16} /> Retour à {system.name}</Link><header className="page-heading"><div><p className="eyebrow">DÉCISION DE GOUVERNANCE · {system.referenceId}</p><h1>Enregistrer une décision</h1><p>Risque : {system.riskScore}/100 · Conformité : {system.complianceScore}/100 · Actions correctives ouvertes : {openActions}</p></div></header><GovernanceDecisionForm systemId={system.id} /></section>; }
