"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
const schema = z.object({ actionId: z.string().min(1), status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED"]), evidenceNote: z.string().trim().max(2000) });
export async function updateCorrectiveActionAction(formData: FormData) {
  const actor = await requirePermission("actions:update-own");
  const parsed = schema.safeParse({ actionId: formData.get("actionId"), status: formData.get("status"), evidenceNote: formData.get("evidenceNote") });
  if (!parsed.success) throw new Error("Action corrective invalide.");
  const action = await getDb().correctiveAction.findUnique({ where: { id: parsed.data.actionId }, select: { id: true, assigneeId: true, aiSystemId: true } });
  if (!action || (actor.role !== "ADMINISTRATOR" && action.assigneeId !== actor.id)) throw new Error("Vous ne pouvez pas modifier cette action.");
  await getDb().$transaction(async (tx) => { await tx.correctiveAction.update({ where: { id: action.id }, data: { status: parsed.data.status, evidenceNote: parsed.data.evidenceNote || null, completedAt: parsed.data.status === "COMPLETED" ? new Date() : null } }); await tx.auditEvent.create({ data: { eventType: "ACTION_UPDATED", summary: `Action corrective mise à jour : ${parsed.data.status.replaceAll("_", " ")}`, entityType: "CorrectiveAction", entityId: action.id, aiSystemId: action.aiSystemId, actorId: actor.id } }); });
  revalidatePath("/"); revalidatePath(`/systems/${action.aiSystemId}`);
}
