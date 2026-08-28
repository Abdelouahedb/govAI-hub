import { getDb } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";

const activeActionStatuses = ["OPEN", "IN_PROGRESS", "BLOCKED"] as const;
const openIncidentStatuses = ["OPEN", "INVESTIGATING"] as const;

export type Notification = {
  id: string;
  type: "action" | "assessment" | "review" | "decision" | "incident";
  href: string;
  priority: "high" | "medium";
  subject: string;
  systemName: string;
  referenceId: string;
  status?: string;
  severity?: string;
  dueDate?: Date | null;
};

function actionPriority(action: { status: string; priority: string; dueDate: Date | null }, now: Date): Notification["priority"] {
  return action.status === "BLOCKED" || action.priority === "CRITICAL" || (action.dueDate !== null && action.dueDate.getTime() < now.getTime()) ? "high" : "medium";
}

function sortNotifications(items: Notification[]) {
  return items.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority === "high" ? -1 : 1;
    const leftDue = left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDue - rightDue || left.subject.localeCompare(right.subject);
  });
}

export async function getNotifications(userId: string, role: UserRole): Promise<Notification[]> {
  const now = new Date();
  if (role === "VIEWER") return [];

  if (role === "AI_SYSTEM_OWNER") {
    const [actions, assessments, incidents] = await Promise.all([
      getDb().correctiveAction.findMany({ where: { assigneeId: userId, status: { in: [...activeActionStatuses] } }, select: { id: true, title: true, status: true, priority: true, dueDate: true, aiSystem: { select: { id: true, name: true, referenceId: true } } } }),
      getDb().aiSystem.findMany({ where: { ownerId: userId, riskAssessments: { none: {} } }, select: { id: true, name: true, referenceId: true } }),
      getDb().incident.findMany({ where: { aiSystem: { ownerId: userId }, status: { in: [...openIncidentStatuses] } }, select: { id: true, title: true, status: true, severity: true, aiSystem: { select: { id: true, name: true, referenceId: true } } } }),
    ]);
    return sortNotifications([
      ...actions.map((action) => ({ id: `action:${action.id}`, type: "action" as const, href: `/systems/${action.aiSystem.id}`, priority: actionPriority(action, now), subject: action.title, systemName: action.aiSystem.name, referenceId: action.aiSystem.referenceId, status: action.status, dueDate: action.dueDate })),
      ...assessments.map((system) => ({ id: `assessment:${system.id}`, type: "assessment" as const, href: `/systems/${system.id}/assessment`, priority: "medium" as const, subject: system.name, systemName: system.name, referenceId: system.referenceId })),
      ...incidents.map((incident) => ({ id: `incident:${incident.id}`, type: "incident" as const, href: `/systems/${incident.aiSystem.id}`, priority: "high" as const, subject: incident.title, systemName: incident.aiSystem.name, referenceId: incident.aiSystem.referenceId, status: incident.status, severity: incident.severity })),
    ]);
  }

  const incidents = await getDb().incident.findMany({ where: { status: { in: [...openIncidentStatuses] } }, select: { id: true, title: true, status: true, severity: true, aiSystem: { select: { id: true, name: true, referenceId: true } } } });
  const incidentNotifications = incidents.map((incident) => ({ id: `incident:${incident.id}`, type: "incident" as const, href: `/systems/${incident.aiSystem.id}`, priority: "high" as const, subject: incident.title, systemName: incident.aiSystem.name, referenceId: incident.aiSystem.referenceId, status: incident.status, severity: incident.severity }));

  if (role === "RISK_COMPLIANCE_AUDITOR" || role === "GOVERNANCE_APPROVER") {
    const isAuditor = role === "RISK_COMPLIANCE_AUDITOR";
    const systems = await getDb().aiSystem.findMany({ where: { status: isAuditor ? "IN_REVIEW" : { in: ["IN_REVIEW", "ACTION_REQUIRED"] }, riskAssessments: { some: {} } }, select: { id: true, name: true, referenceId: true } });
    const type = isAuditor ? "review" as const : "decision" as const;
    return sortNotifications([
      ...systems.map((system) => ({ id: `${type}:${system.id}`, type, href: isAuditor ? `/systems/${system.id}/audit` : `/systems/${system.id}/decision`, priority: "high" as const, subject: system.name, systemName: system.name, referenceId: system.referenceId })),
      ...incidentNotifications,
    ]);
  }

  const actions = await getDb().correctiveAction.findMany({ where: { status: { in: [...activeActionStatuses] } }, select: { id: true, title: true, status: true, priority: true, dueDate: true, aiSystem: { select: { id: true, name: true, referenceId: true } } } });
  return sortNotifications([
    ...incidentNotifications,
    ...actions.map((action) => ({ id: `action:${action.id}`, type: "action" as const, href: `/systems/${action.aiSystem.id}`, priority: actionPriority(action, now), subject: action.title, systemName: action.aiSystem.name, referenceId: action.aiSystem.referenceId, status: action.status, dueDate: action.dueDate })),
  ]);
}

export async function getNotificationCount(userId: string, role: UserRole) {
  return (await getNotifications(userId, role)).length;
}
