import { getDb } from "@/lib/db";

export async function getOwnerWork(userId: string) {
  const [systems, actions] = await Promise.all([
    getDb().aiSystem.findMany({
      where: { ownerId: userId },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        referenceId: true,
        name: true,
        status: true,
        riskScore: true,
        riskLevel: true,
        lifecycleStage: true,
        riskAssessments: { orderBy: { version: "desc" }, take: 1, select: { id: true } },
      },
    }),
    getDb().correctiveAction.findMany({
      where: { assigneeId: userId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        aiSystem: { select: { id: true, name: true, referenceId: true } },
      },
    }),
  ]);

  return { systems, actions };
}

export async function getReviewQueue(role: "RISK_COMPLIANCE_AUDITOR" | "GOVERNANCE_APPROVER") {
  const statuses = role === "RISK_COMPLIANCE_AUDITOR" ? ["IN_REVIEW"] as const : ["IN_REVIEW", "ACTION_REQUIRED"] as const;
  return getDb().aiSystem.findMany({
    where: { status: { in: [...statuses] }, riskAssessments: { some: {} } },
    orderBy: [{ riskScore: "desc" }, { updatedAt: "asc" }],
    take: 8,
    select: { id: true, referenceId: true, name: true, status: true, riskScore: true, riskLevel: true, owner: { select: { name: true } }, department: { select: { name: true } }, correctiveActions: { where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } }, select: { id: true } } },
  });
}

export async function getAdminOverview() {
  const [systems, users, openActions, highRisk] = await Promise.all([
    getDb().aiSystem.count(),
    getDb().user.count({ where: { active: true } }),
    getDb().correctiveAction.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
    getDb().aiSystem.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
  ]);
  return { systems, users, openActions, highRisk };
}
