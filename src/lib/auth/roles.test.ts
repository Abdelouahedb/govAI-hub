import { describe, expect, it } from "vitest";
import { hasPermission, permissions } from "./roles";

describe("role permissions", () => {
  it("allows administrators to perform every defined permission", () => {
    for (const permission of permissions) {
      expect(hasPermission("ADMINISTRATOR", permission)).toBe(true);
    }
  });

  it("allows owners to register and assess their systems without approving them", () => {
    expect(hasPermission("AI_SYSTEM_OWNER", "registry:create")).toBe(true);
    expect(hasPermission("AI_SYSTEM_OWNER", "assessment:complete")).toBe(true);
    expect(hasPermission("AI_SYSTEM_OWNER", "decision:record")).toBe(false);
  });

  it("separates audit recommendations from governance decisions", () => {
    expect(hasPermission("RISK_COMPLIANCE_AUDITOR", "decision:recommend")).toBe(true);
    expect(hasPermission("RISK_COMPLIANCE_AUDITOR", "decision:record")).toBe(false);
    expect(hasPermission("GOVERNANCE_APPROVER", "decision:record")).toBe(true);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission("VIEWER", "dashboard:view")).toBe(true);
    expect(hasPermission("VIEWER", "registry:view")).toBe(true);
    expect(hasPermission("VIEWER", "registry:create")).toBe(false);
  });
});
