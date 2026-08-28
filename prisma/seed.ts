import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { assessRisk, type RiskInput } from "../src/lib/risk-engine";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed GovAI Hub.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const configuredSeedPassword = process.env.SEED_USER_PASSWORD;

if (!configuredSeedPassword || configuredSeedPassword.length < 12) {
  throw new Error("SEED_USER_PASSWORD must contain at least 12 characters.");
}
const initialUserPassword: string = configuredSeedPassword;

const departments = [
  { id: "dept-hr", code: "HR", name: "Human Resources", description: "People operations and talent management." },
  { id: "dept-ops", code: "OPS", name: "Customer Operations", description: "Customer support and service operations." },
  { id: "dept-sales", code: "SALES", name: "Sales Planning", description: "Commercial planning and demand analysis." },
  { id: "dept-marketing", code: "MKT", name: "Marketing", description: "Brand, campaigns, and content operations." },
  { id: "dept-finance", code: "FIN", name: "Finance", description: "Financial operations and fraud monitoring." },
] as const;

const users = [
  { id: "user-admin", name: "Amine Mansouri", email: "amine.admin@govai.example", role: "ADMINISTRATOR" as const, departmentId: null },
  { id: "user-owner-hr", name: "Nadia El Amrani", email: "nadia.hr@govai.example", role: "AI_SYSTEM_OWNER" as const, departmentId: "dept-hr" },
  { id: "user-owner-ops", name: "Youssef Karim", email: "youssef.ops@govai.example", role: "AI_SYSTEM_OWNER" as const, departmentId: "dept-ops" },
  { id: "user-auditor", name: "Salma Idrissi", email: "salma.audit@govai.example", role: "RISK_COMPLIANCE_AUDITOR" as const, departmentId: null },
  { id: "user-approver", name: "Omar Benali", email: "omar.governance@govai.example", role: "GOVERNANCE_APPROVER" as const, departmentId: null },
] as const;

const controls = [
  { id: "control-data", code: "DATA-01", title: "Gouvernance des données personnelles", category: "Data and privacy", description: "Document purpose, access, retention, and deletion rules for personal data.", evidenceGuidance: "Data inventory, retention schedule, access review." },
  { id: "control-impact", code: "RISK-01", title: "Évaluation de l’impact individuel", category: "Risk management", description: "Assess potential adverse effects before deployment and after material change.", evidenceGuidance: "Approved impact assessment and review record." },
  { id: "control-human", code: "HUM-01", title: "Supervision humaine effective", category: "Human oversight", description: "Assign a trained reviewer with authority to inspect, override, and stop outcomes.", evidenceGuidance: "RACI, reviewer procedure, override log." },
  { id: "control-explain", code: "TRN-01", title: "Explication des résultats", category: "Transparency", description: "Provide understandable reasons for recommendations or decisions.", evidenceGuidance: "Explanation template and sample decision notices." },
  { id: "control-appeal", code: "HUM-02", title: "Recours et contestation", category: "Human oversight", description: "Provide a route to contest, correct, and escalate an outcome.", evidenceGuidance: "Appeal procedure, service level, case log." },
  { id: "control-bias", code: "FAIR-01", title: "Surveillance des biais", category: "Fairness", description: "Test outcome quality across relevant groups and investigate material disparities.", evidenceGuidance: "Test plan, results, thresholds, remediation record." },
  { id: "control-security", code: "SEC-01", title: "Mesures de sécurité", category: "Security", description: "Define access restrictions, secure development practices, vulnerability testing, incident response, and remediation ownership.", evidenceGuidance: "Access-control review, security test results, incident procedure, remediation record." },
  { id: "control-monitoring", code: "MON-01", title: "Surveillance continue et escalade", category: "Monitoring", description: "Monitor performance, drift, misuse, incidents, and material changes with clear escalation responsibilities.", evidenceGuidance: "Monitoring plan, thresholds, review cadence, incident and escalation log." },
] as const;

type SystemSeed = {
  id: string;
  referenceId: string;
  name: string;
  description: string;
  purpose: string;
  intendedUsers: string;
  dataCategories: string[];
  departmentId: string;
  ownerId: string;
  lifecycleStage: "DEVELOPMENT" | "PILOT" | "PRODUCTION";
  autonomyLevel: "ASSISTIVE" | "HUMAN_IN_THE_LOOP" | "HUMAN_ON_THE_LOOP";
  status: "DRAFT" | "IN_REVIEW" | "ACTION_REQUIRED" | "APPROVED";
  complianceScore: number;
  riskInput: RiskInput;
  modelProvider?: string;
  modelName?: string;
};

const systems: SystemSeed[] = [
  {
    id: "system-recruit-ai",
    referenceId: "AI-001",
    name: "RecruitAI",
    description: "Fictional decision-support system that analyzes CVs and ranks applicants for recruiter review.",
    purpose: "Help recruiters prioritize applications while keeping interview decisions under human authority.",
    intendedUsers: "Recruiters and hiring managers",
    dataCategories: ["CV data", "Contact information", "Employment history", "Education history"],
    departmentId: "dept-hr",
    ownerId: "user-owner-hr",
    lifecycleStage: "PILOT",
    autonomyLevel: "HUMAN_IN_THE_LOOP",
    status: "ACTION_REQUIRED",
    complianceScore: 52,
    modelProvider: "Fictional internal model",
    modelName: "RecruitRank v0.8",
    riskInput: { usesSensitiveData: true, affectsIndividuals: true, makesAutonomousDecisions: true, lacksHumanReview: false, lacksExplanation: true, lacksAppeal: true },
  },
  {
    id: "system-support-copilot",
    referenceId: "AI-002",
    name: "Support Copilot",
    description: "Fictional assistant that drafts responses for customer-support agents.",
    purpose: "Reduce response drafting time while agents remain responsible for every message.",
    intendedUsers: "Customer-support agents",
    dataCategories: ["Support conversations", "Account context"],
    departmentId: "dept-ops",
    ownerId: "user-owner-ops",
    lifecycleStage: "PILOT",
    autonomyLevel: "ASSISTIVE",
    status: "IN_REVIEW",
    complianceScore: 78,
    riskInput: { usesSensitiveData: true, affectsIndividuals: false, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: false, lacksAppeal: false },
  },
  {
    id: "system-demand-forecast",
    referenceId: "AI-003",
    name: "Demand Forecast",
    description: "Fictional forecasting model for monthly product demand.",
    purpose: "Support inventory and sales planning with human-reviewed forecasts.",
    intendedUsers: "Sales planners",
    dataCategories: ["Aggregated sales", "Product catalog"],
    departmentId: "dept-sales",
    ownerId: "user-admin",
    lifecycleStage: "PRODUCTION",
    autonomyLevel: "ASSISTIVE",
    status: "APPROVED",
    complianceScore: 84,
    riskInput: { usesSensitiveData: false, affectsIndividuals: false, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: true, lacksAppeal: false },
  },
  {
    id: "system-content-studio",
    referenceId: "AI-004",
    name: "Content Studio",
    description: "Fictional writing assistant for internal marketing drafts.",
    purpose: "Create first drafts that are reviewed by marketing staff before publication.",
    intendedUsers: "Marketing specialists",
    dataCategories: ["Campaign briefs", "Public product information"],
    departmentId: "dept-marketing",
    ownerId: "user-admin",
    lifecycleStage: "PRODUCTION",
    autonomyLevel: "ASSISTIVE",
    status: "APPROVED",
    complianceScore: 91,
    riskInput: { usesSensitiveData: false, affectsIndividuals: false, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: false, lacksAppeal: false },
  },
  {
    id: "system-fraud-signal",
    referenceId: "AI-005",
    name: "Fraud Signal",
    description: "Fictional model that flags unusual transactions for analyst investigation.",
    purpose: "Prioritize potentially fraudulent transactions without automatically blocking customers.",
    intendedUsers: "Fraud analysts",
    dataCategories: ["Transaction history", "Account identifiers", "Device signals"],
    departmentId: "dept-finance",
    ownerId: "user-admin",
    lifecycleStage: "DEVELOPMENT",
    autonomyLevel: "HUMAN_ON_THE_LOOP",
    status: "DRAFT",
    complianceScore: 64,
    riskInput: { usesSensitiveData: true, affectsIndividuals: true, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: true, lacksAppeal: false },
  },
];

async function seed() {
  const initialUserPasswordHash = await hash(initialUserPassword, 12);

  for (const department of departments) {
    await db.department.upsert({ where: { id: department.id }, update: department, create: department });
  }

  for (const user of users) {
    const data = { ...user, passwordHash: initialUserPasswordHash };
    await db.user.upsert({ where: { id: user.id }, update: data, create: data });
  }

  for (const control of controls) {
    await db.control.upsert({ where: { id: control.id }, update: control, create: control });
  }

  for (const system of systems) {
    const result = assessRisk(system.riskInput);
    const data = {
      referenceId: system.referenceId,
      name: system.name,
      description: system.description,
      purpose: system.purpose,
      intendedUsers: system.intendedUsers,
      dataCategories: system.dataCategories,
      departmentId: system.departmentId,
      ownerId: system.ownerId,
      lifecycleStage: system.lifecycleStage,
      autonomyLevel: system.autonomyLevel,
      status: system.status,
      complianceScore: system.complianceScore,
      riskScore: result.score,
      riskLevel: result.level.toUpperCase() as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      usesPersonalData: system.dataCategories.some((category) => category !== "Aggregated sales" && category !== "Public product information"),
      usesSensitiveData: system.riskInput.usesSensitiveData,
      hasMaterialImpact: system.riskInput.affectsIndividuals,
      modelProvider: system.modelProvider ?? null,
      modelName: system.modelName ?? null,
      lastAssessedAt: new Date("2026-08-05T10:00:00.000Z"),
      submittedAt: system.status === "DRAFT" ? null : new Date("2026-08-05T10:30:00.000Z"),
    };

    await db.aiSystem.upsert({ where: { id: system.id }, update: data, create: { id: system.id, ...data } });
  }

  const recruitResult = assessRisk(systems[0].riskInput);
  await db.riskAssessment.upsert({
    where: { aiSystemId_version: { aiSystemId: "system-recruit-ai", version: 1 } },
    update: { answers: systems[0].riskInput, score: recruitResult.score, riskLevel: "CRITICAL", status: "SUBMITTED", submittedAt: new Date("2026-08-05T10:30:00.000Z") },
    create: { id: "assessment-recruit-ai-v1", aiSystemId: "system-recruit-ai", assessorId: "user-owner-hr", version: 1, answers: systems[0].riskInput, score: recruitResult.score, riskLevel: "CRITICAL", status: "SUBMITTED", submittedAt: new Date("2026-08-05T10:30:00.000Z") },
  });

  for (const contribution of recruitResult.contributions) {
    await db.riskFactor.upsert({
      where: { assessmentId_ruleKey: { assessmentId: "assessment-recruit-ai-v1", ruleKey: contribution.key } },
      update: { label: contribution.factor, points: contribution.points, recommendation: contribution.recommendation },
      create: { assessmentId: "assessment-recruit-ai-v1", ruleKey: contribution.key, label: contribution.factor, points: contribution.points, recommendation: contribution.recommendation },
    });
  }

  const recruitControls = ["control-data", "control-impact", "control-human", "control-explain", "control-appeal", "control-bias"];
  for (const controlId of recruitControls) {
    await db.aiSystemControl.upsert({
      where: { aiSystemId_controlId: { aiSystemId: "system-recruit-ai", controlId } },
      update: { rationale: "Recommended by the transparent RecruitAI risk assessment." },
      create: { aiSystemId: "system-recruit-ai", controlId, rationale: "Recommended by the transparent RecruitAI risk assessment." },
    });
  }

  const actions = [
    { id: "action-recruit-explain", title: "Documenter l’explication des scores candidats", description: "Créez une explication destinée aux réviseurs et un modèle de notification aux candidats.", priority: "HIGH" as const, status: "IN_PROGRESS" as const, dueDate: new Date("2026-08-21T00:00:00.000Z"), assigneeId: "user-owner-hr" },
    { id: "action-recruit-appeal", title: "Créer le processus de recours des candidats", description: "Définissez les responsabilités de réception, de revue, de correction et de réponse.", priority: "HIGH" as const, status: "OPEN" as const, dueDate: new Date("2026-08-28T00:00:00.000Z"), assigneeId: "user-owner-hr" },
    { id: "action-recruit-bias", title: "Terminer les tests de biais avant le pilote", description: "Testez les résultats de classement et documentez les seuils d’escalade.", priority: "CRITICAL" as const, status: "OPEN" as const, dueDate: new Date("2026-08-18T00:00:00.000Z"), assigneeId: "user-auditor" },
    { id: "action-recruit-retention", title: "Approuver le calendrier de conservation des CV", description: "Confirmez les périodes de conservation et les responsabilités de suppression.", priority: "MEDIUM" as const, status: "BLOCKED" as const, dueDate: new Date("2026-09-04T00:00:00.000Z"), assigneeId: "user-owner-hr" },
  ];

  for (const action of actions) {
    await db.correctiveAction.upsert({
      where: { id: action.id },
      update: action,
      create: { ...action, aiSystemId: "system-recruit-ai", createdById: "user-auditor" },
    });
  }

  const events = [
    { id: "event-recruit-submit", eventType: "ASSESSMENT_SUBMITTED" as const, summary: "RecruitAI assessment submitted for review", entityType: "RiskAssessment", entityId: "assessment-recruit-ai-v1", aiSystemId: "system-recruit-ai", actorId: "user-owner-hr", occurredAt: new Date("2026-08-06T11:42:00.000Z") },
    { id: "event-control-assigned", eventType: "CONTROL_ASSIGNED" as const, summary: "Human oversight control assigned to Salma", entityType: "AiSystemControl", entityId: "control-human", aiSystemId: "system-recruit-ai", actorId: "user-auditor", occurredAt: new Date("2026-08-06T10:00:00.000Z") },
    { id: "event-demand-approved", eventType: "GOVERNANCE_DECISION_RECORDED" as const, summary: "Demand Forecast approved with no conditions", entityType: "AiSystem", entityId: "system-demand-forecast", aiSystemId: "system-demand-forecast", actorId: "user-approver", occurredAt: new Date("2026-08-05T14:00:00.000Z") },
    { id: "event-support-evidence", eventType: "AUDIT_UPDATED" as const, summary: "Support Copilot evidence updated", entityType: "AiSystem", entityId: "system-support-copilot", aiSystemId: "system-support-copilot", actorId: "user-owner-ops", occurredAt: new Date("2026-08-05T09:30:00.000Z") },
  ];

  for (const event of events) {
    await db.auditEvent.upsert({ where: { id: event.id }, update: event, create: event });
  }
}

seed()
  .then(() => console.log("GovAI Hub seed data is ready."))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
