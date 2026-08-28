import { getDb } from "@/lib/db";

export async function getSystems() {
  return getDb().aiSystem.findMany({
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    select: {
      id: true,
      referenceId: true,
      name: true,
      purpose: true,
      lifecycleStage: true,
      autonomyLevel: true,
      riskScore: true,
      riskLevel: true,
      status: true,
      updatedAt: true,
      department: { select: { name: true } },
      owner: { select: { name: true } },
    },
  });
}

export async function getSystemById(id: string) {
  return getDb().aiSystem.findUnique({
    where: { id },
    include: {
      department: { select: { name: true } },
      owner: { select: { name: true, email: true } },
      riskAssessments: {
        orderBy: { version: "desc" },
        take: 1,
        include: { triggeredFactors: true },
      },
      recommendedControls: { include: { control: true } },
      complianceAudits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { auditor: { select: { name: true } }, checks: { include: { control: true } } },
      },
      correctiveActions: { orderBy: { createdAt: "desc" }, include: { assignee: { select: { name: true } } } },
      incidents: { orderBy: { reportedAt: "desc" }, include: { reporter: { select: { name: true } }, assignee: { select: { name: true } } } },
      governanceDecisions: { orderBy: { decidedAt: "desc" }, take: 1, include: { approver: { select: { name: true } } } },
      auditEvents: { orderBy: { occurredAt: "desc" }, take: 20, include: { actor: { select: { name: true } } } },
    },
  });
}
