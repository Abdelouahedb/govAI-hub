import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { ComplianceAuditForm } from "@/components/compliance-audit-form";
import { requireUser } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/roles";
import { getSystemById } from "@/lib/data/systems";

export default async function ComplianceAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireUser();
  if (!hasPermission(actor.role, "compliance:audit")) redirect(`/systems/${id}`);
  const system = await getSystemById(id);
  if (!system) notFound();
  const controls = system.recommendedControls.map((item) => ({ id: item.control.id, code: item.control.code, title: item.control.title, description: item.control.description, evidenceGuidance: item.control.evidenceGuidance, rationale: item.rationale }));
  return <section className="app-page narrow-page"><Link href={`/systems/${system.id}`} className="back-button"><ArrowLeft size={16} /> Retour à {system.name}</Link><header className="page-heading"><div><p className="eyebrow">AUDIT DE CONFORMITÉ · {system.referenceId}</p><h1>Vérifier les contrôles</h1><p>Pour chaque contrôle recommandé, enregistrez un résultat, le constat et les preuves examinées.</p></div></header>{controls.length ? <ComplianceAuditForm systemId={system.id} controls={controls} /> : <div className="empty-state"><ClipboardText size={28} /><h2>Aucun contrôle à auditer</h2><p>Une évaluation des risques doit d’abord recommander des contrôles pour ce système.</p></div>}</section>;
}
