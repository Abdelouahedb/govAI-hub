"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

const resultSchema = z.enum(["CONFORMING", "PARTIALLY_CONFORMING", "NON_CONFORMING", "NOT_APPLICABLE"]);
const auditSchema = z.object({ systemId: z.string().min(1), controls: z.array(z.object({ controlId: z.string().min(1), result: resultSchema, finding: z.string().trim().max(2000), evidence: z.string().trim().max(2000) })).min(1) });
export type ComplianceAuditFormState = { error?: string } | undefined;

function auditScore(results: Array<z.infer<typeof resultSchema>>) {
  const applicable = results.filter((result) => result !== "NOT_APPLICABLE");
  if (!applicable.length) return 100;
  const points = applicable.reduce((total, result) => total + (result === "CONFORMING" ? 100 : result === "PARTIALLY_CONFORMING" ? 50 : 0), 0);
  return Math.round(points / applicable.length);
}

export async function saveComplianceAuditAction(_previousState: ComplianceAuditFormState, formData: FormData): Promise<ComplianceAuditFormState> {
  const auditor = await requirePermission("compliance:audit");
  const systemId = String(formData.get("systemId") ?? "");
  const controls = String(formData.get("controlIds") ?? "").split(",").filter(Boolean).map((controlId) => ({ controlId, result: formData.get(`result_${controlId}`), finding: String(formData.get(`finding_${controlId}`) ?? ""), evidence: String(formData.get(`evidence_${controlId}`) ?? "") }));
  const parsed = auditSchema.safeParse({ systemId, controls });
  if (!parsed.success) return { error: "Sélectionnez un résultat pour chaque contrôle et vérifiez les informations saisies." };
  const system = await getDb().aiSystem.findUnique({ where: { id: parsed.data.systemId }, select: { id: true, ownerId: true, riskLevel: true } });
  if (!system) return { error: "Ce système d’IA n’existe plus." };
  const score = auditScore(parsed.data.controls.map((control) => control.result));
  const nonConforming = parsed.data.controls.filter((control) => control.result === "NON_CONFORMING").length;

  await getDb().$transaction(async (tx) => {
    const audit = await tx.complianceAudit.create({
      data: { title: `Audit de conformité - ${new Date().toLocaleDateString("fr-FR")}`, status: "COMPLETED", score, summary: `${nonConforming} contrôle${nonConforming === 1 ? " non conforme" : "s non conformes"}; score de conformité ${score}/100.`, startedAt: new Date(), completedAt: new Date(), aiSystemId: system.id, auditorId: auditor.id, checks: { create: parsed.data.controls.map((control) => ({ controlId: control.controlId, result: control.result, finding: control.finding || null, evidence: control.evidence || null })) } },
    });
    await Promise.all(parsed.data.controls.map((control) => tx.aiSystemControl.updateMany({ where: { aiSystemId: system.id, controlId: control.controlId }, data: { status: control.result === "CONFORMING" ? "IMPLEMENTED" : control.result === "PARTIALLY_CONFORMING" ? "PLANNED" : control.result === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "RECOMMENDED", evidenceNote: control.evidence || null } })));
    await tx.aiSystem.update({ where: { id: system.id }, data: { complianceScore: score, status: nonConforming > 0 ? "ACTION_REQUIRED" : "IN_REVIEW" } });
    for (const control of parsed.data.controls.filter((item) => item.result === "NON_CONFORMING")) {
      const controlRecord = await tx.control.findUnique({ where: { id: control.controlId }, select: { code: true, title: true } });
      if (!controlRecord) continue;
      const title = `Corriger la non-conformité : ${controlRecord.code}`;
      const existing = await tx.correctiveAction.findFirst({ where: { aiSystemId: system.id, title, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } }, select: { id: true } });
      if (!existing) await tx.correctiveAction.create({ data: { title, description: control.finding || `Traiter la non-conformité liée au contrôle ${controlRecord.title}.`, priority: system.riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH", aiSystemId: system.id, assigneeId: system.ownerId, createdById: auditor.id } });
    }
    await tx.auditEvent.create({ data: { eventType: "AUDIT_UPDATED", summary: `Audit de conformité terminé : ${score}/100, ${nonConforming} non-conformité(s)`, entityType: "ComplianceAudit", entityId: audit.id, aiSystemId: system.id, actorId: auditor.id, metadata: { score, nonConforming } } });
  }, { timeout: 15_000 });
  revalidatePath("/"); revalidatePath("/systems"); revalidatePath(`/systems/${system.id}`);
  redirect(`/systems/${system.id}`);
}
