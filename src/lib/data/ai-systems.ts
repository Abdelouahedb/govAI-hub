import { z } from "zod";
import { getDb } from "@/lib/db";
import { hasDatabaseConfiguration } from "@/lib/env";

const registryQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export type RegistrySystem = {
  id: string;
  referenceId: string;
  name: string;
  monogram: string;
  department: string;
  owner: string;
  riskScore: number;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  compliance: number;
  openActions: number;
  status:
    | "DRAFT"
    | "IN_REVIEW"
    | "ACTION_REQUIRED"
    | "APPROVED"
    | "CONDITIONALLY_APPROVED"
    | "REJECTED"
    | "SUSPENDED";
};

export type RegistryActivity = {
  id: string;
  text: string;
  occurredAt: Date;
};

type RegistryDashboard = {
  databaseStatus: "ready" | "unconfigured";
  systems: RegistrySystem[];
  recentActivity: RegistryActivity[];
  metrics: {
    registeredSystems: number;
    departmentCount: number;
    highRiskSystems: number;
    averageCompliance: number;
    openActions: number;
  };
};

const riskLevelLabels = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const emptyDashboard: RegistryDashboard = {
  databaseStatus: "unconfigured",
  systems: [],
  recentActivity: [],
  metrics: {
    registeredSystems: 0,
    departmentCount: 0,
    highRiskSystems: 0,
    averageCompliance: 0,
    openActions: 0,
  },
};

export async function getRegistryDashboard(
  input: z.input<typeof registryQuerySchema> = {},
): Promise<RegistryDashboard> {
  const { limit } = registryQuerySchema.parse(input);

  if (!hasDatabaseConfiguration()) {
    return emptyDashboard;
  }

  const db = getDb();
  const [
    systems,
    recentActivity,
    registeredSystems,
    departmentCount,
    elevatedRiskSystems,
    openActions,
    compliance,
  ] =
    await Promise.all([
      db.aiSystem.findMany({
        take: limit,
        orderBy: [{ riskScore: "desc" }, { name: "asc" }],
        select: {
          id: true,
          referenceId: true,
          name: true,
          riskScore: true,
          riskLevel: true,
          complianceScore: true,
          status: true,
          department: { select: { name: true } },
          owner: { select: { name: true } },
          _count: {
            select: {
              correctiveActions: {
                where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
              },
            },
          },
        },
      }),
      db.auditEvent.findMany({
        take: 6,
        orderBy: { occurredAt: "desc" },
        select: { id: true, summary: true, occurredAt: true },
      }),
      db.aiSystem.count(),
      db.department.count({ where: { aiSystems: { some: {} } } }),
      db.aiSystem.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
      db.correctiveAction.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      }),
      db.aiSystem.aggregate({ _avg: { complianceScore: true } }),
    ]);

  const registrySystems: RegistrySystem[] = systems.map((system) => ({
    id: system.id,
    referenceId: system.referenceId,
    name: system.name,
    monogram: initials(system.name),
    department: system.department.name,
    owner: system.owner.name,
    riskScore: system.riskScore,
    riskLevel: riskLevelLabels[system.riskLevel],
    compliance: system.complianceScore,
    openActions: system._count.correctiveActions,
    status: system.status,
  }));

  return {
    databaseStatus: "ready",
    systems: registrySystems,
    recentActivity: recentActivity.map((event) => ({
      id: event.id,
      text: event.summary,
      occurredAt: event.occurredAt,
    })),
    metrics: {
      registeredSystems,
      departmentCount,
      highRiskSystems: elevatedRiskSystems,
      averageCompliance: Math.round(compliance._avg.complianceScore ?? 0),
      openActions,
    },
  };
}
