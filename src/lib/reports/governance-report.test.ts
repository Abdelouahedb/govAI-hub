import { describe, expect, it } from "vitest";
import { createGovernanceReport, type GovernanceReportData } from "./governance-report";

const reportData: GovernanceReportData = {
  generatedAt: new Date("2026-08-28T09:45:00Z"),
  totalSystems: 1,
  pendingApprovals: 0,
  overdueActions: 0,
  openIncidents: 0,
  lifecycle: [{ key: "PILOT", count: 1 }],
  risk: [{ key: "MODERATE", count: 1 }],
  featuredIncident: null,
  systems: [{
    referenceId: "AI-2026-001",
    name: "Citizen Services Copilot",
    lifecycleStage: "PILOT",
    riskScore: 48,
    riskLevel: "MODERATE",
    status: "IN_REVIEW",
    updatedAt: new Date("2026-08-27T15:00:00Z"),
    department: { name: "Citizen Experience" },
  }],
};

describe("createGovernanceReport", () => {
  it("renders a non-empty PDF without changing the route contract", async () => {
    const bytes = await createGovernanceReport(reportData, "en");

    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(10_000);
  }, 30_000);
});
