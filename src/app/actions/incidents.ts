"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

const reportSchema = z.object({ aiSystemId: z.string().min(1), title: z.string().trim().min(5).max(160), description: z.string().trim().min(20).max(3000), severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), occurredAt: z.string().min(1) });
const updateSchema = z.object({ incidentId: z.string().min(1), status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]), resolutionNote: z.string().trim().max(3000) });

export async function reportIncidentAction(formData: FormData) {
  const actor = await requirePermission("incidents:report");
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Incident invalide.");
  const system = await getDb().aiSystem.findUnique({ where: { id: parsed.data.aiSystemId }, select: { id: true, ownerId: true } });
  if (!system || (actor.role === "AI_SYSTEM_OWNER" && system.ownerId !== actor.id)) throw new Error("Vous ne pouvez pas déclarer cet incident.");
  const incident = await getDb().incident.create({ data: { ...parsed.data, occurredAt: new Date(parsed.data.occurredAt), reporterId: actor.id } });
  await getDb().auditEvent.create({ data: { eventType: "INCIDENT_REPORTED", summary: `Incident déclaré : ${incident.title}`, entityType: "Incident", entityId: incident.id, aiSystemId: system.id, actorId: actor.id, metadata: { severity: incident.severity } } });
  revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath(`/systems/${system.id}`);
}

export async function updateIncidentAction(formData: FormData) {
  const actor = await requirePermission("incidents:update");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Mise à jour d’incident invalide.");
  const incident = await getDb().incident.findUnique({ where: { id: parsed.data.incidentId }, select: { id: true, aiSystemId: true } });
  if (!incident) throw new Error("Incident introuvable.");
  const resolved = parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED";
  await getDb().$transaction(async (tx) => {
    await tx.incident.update({ where: { id: incident.id }, data: { status: parsed.data.status, resolutionNote: parsed.data.resolutionNote || null, resolvedAt: resolved ? new Date() : null } });
    await tx.auditEvent.create({ data: { eventType: "INCIDENT_UPDATED", summary: `Incident mis à jour : ${parsed.data.status.replaceAll("_", " ")}`, entityType: "Incident", entityId: incident.id, aiSystemId: incident.aiSystemId, actorId: actor.id, metadata: { status: parsed.data.status } } });
  });
  revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath(`/systems/${incident.aiSystemId}`);
}
