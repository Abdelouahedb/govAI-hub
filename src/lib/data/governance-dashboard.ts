import { getDb } from "@/lib/db";

export async function getGovernanceDashboard() {
  const now = new Date();
  const [lifecycle, risk, pendingApprovals, overdueActions, totalSystems, openIncidents, featuredIncident, systems] = await Promise.all([
    getDb().aiSystem.groupBy({ by: ["lifecycleStage"], _count: { _all: true } }),
    getDb().aiSystem.groupBy({ by: ["riskLevel"], _count: { _all: true } }),
    getDb().aiSystem.count({ where: { status: "IN_REVIEW" } }),
    getDb().correctiveAction.count({ where: { dueDate: { lt: now }, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    getDb().aiSystem.count(),
    getDb().incident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    getDb().incident.findFirst({
      where: { status: { in: ["OPEN", "INVESTIGATING"] } },
      orderBy: { reportedAt: "desc" },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        occurredAt: true,
        aiSystem: { select: { id: true, name: true, referenceId: true } },
      },
    }),
    getDb().aiSystem.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        referenceId: true,
        name: true,
        lifecycleStage: true,
        riskScore: true,
        riskLevel: true,
        status: true,
        updatedAt: true,
        department: { select: { name: true } },
      },
    }),
  ]);

  return {
    generatedAt: now,
    totalSystems,
    pendingApprovals,
    overdueActions,
    lifecycle: lifecycle.map((item) => ({ key: item.lifecycleStage, count: item._count._all })),
    risk: risk.map((item) => ({ key: item.riskLevel, count: item._count._all })),
    systems,
    openIncidents,
    featuredIncident,
  };
}
