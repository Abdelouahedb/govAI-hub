import { UserRole } from "../../generated/prisma/enums";

export const roleLabels: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  AI_SYSTEM_OWNER: "AI System Owner",
  RISK_COMPLIANCE_AUDITOR: "Risk & Compliance Auditor",
  GOVERNANCE_APPROVER: "Governance Approver",
  VIEWER: "Viewer",
};

const frenchRoleLabels: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrateur",
  AI_SYSTEM_OWNER: "Responsable du système d’IA",
  RISK_COMPLIANCE_AUDITOR: "Auditeur risques et conformité",
  GOVERNANCE_APPROVER: "Approbateur de gouvernance",
  VIEWER: "Lecteur",
};

export function getRoleLabel(role: UserRole, locale: "fr" | "en" = "en") {
  return locale === "fr" ? frenchRoleLabels[role] : roleLabels[role];
}

export const permissions = [
  "dashboard:view",
  "registry:view",
  "registry:create",
  "registry:update-own",
  "users:manage",
  "rules:manage",
  "assessment:complete",
  "assessment:verify",
  "compliance:audit",
  "actions:create",
  "actions:update-own",
  "incidents:report",
  "incidents:update",
  "decision:recommend",
  "decision:record",
  "system:suspend",
  "audit-trail:view",
] as const;

export type Permission = (typeof permissions)[number];

const allPermissions: readonly Permission[] = permissions;

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMINISTRATOR: allPermissions,
  AI_SYSTEM_OWNER: [
    "dashboard:view",
    "registry:view",
    "registry:create",
    "registry:update-own",
    "assessment:complete",
    "actions:update-own",
    "incidents:report",
  ],
  RISK_COMPLIANCE_AUDITOR: [
    "dashboard:view",
    "registry:view",
    "assessment:verify",
    "compliance:audit",
    "actions:create",
    "incidents:report",
    "incidents:update",
    "decision:recommend",
    "audit-trail:view",
  ],
  GOVERNANCE_APPROVER: [
    "dashboard:view",
    "registry:view",
    "decision:record",
    "system:suspend",
    "incidents:update",
    "audit-trail:view",
  ],
  VIEWER: ["dashboard:view", "registry:view"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
