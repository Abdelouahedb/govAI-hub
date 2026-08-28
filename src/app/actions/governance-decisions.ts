"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
const schema = z.object({ systemId: z.string().min(1), decision: z.enum(["APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "SUSPENDED"]), justification: z.string().trim().min(20, "La justification doit contenir au moins 20 caractères.").max(2000), conditions: z.string().trim().max(2000) });
export type GovernanceDecisionState = { error?: string } | undefined;
export async function recordGovernanceDecisionAction(_previousState: GovernanceDecisionState, formData: FormData): Promise<GovernanceDecisionState> {
  const approver = await requirePermission("decision:record");
  const parsed = schema.safeParse({ systemId: formData.get("systemId"), decision: formData.get("decision"), justification: formData.get("justification"), conditions: formData.get("conditions") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Décision invalide." };
  if (parsed.data.decision === "CONDITIONALLY_APPROVED" && !parsed.data.conditions) return { error: "Indiquez les conditions d’approbation." };
  const system = await getDb().aiSystem.findUnique({ where: { id: parsed.data.systemId }, select: { id: true, correctiveActions: { where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } }, select: { id: true } } } });
  if (!system) return { error: "Ce système n’existe plus." };
  if (parsed.data.decision === "APPROVED" && system.correctiveActions.length) return { error: "Une approbation sans conditions exige la clôture de toutes les actions correctives." };
  await getDb().$transaction(async (tx) => { const decision = await tx.governanceDecision.create({ data: { aiSystemId: system.id, approverId: approver.id, decision: parsed.data.decision, justification: parsed.data.justification, conditions: parsed.data.conditions || null } }); await tx.aiSystem.update({ where: { id: system.id }, data: { status: parsed.data.decision } }); await tx.auditEvent.create({ data: { eventType: parsed.data.decision === "SUSPENDED" ? "SYSTEM_SUSPENDED" : "GOVERNANCE_DECISION_RECORDED", summary: `Décision de gouvernance : ${parsed.data.decision.replaceAll("_", " ")}`, entityType: "GovernanceDecision", entityId: decision.id, aiSystemId: system.id, actorId: approver.id, metadata: { decision: parsed.data.decision } } }); });
  revalidatePath("/"); revalidatePath("/systems"); revalidatePath(`/systems/${system.id}`); redirect(`/systems/${system.id}`);
}
