-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'AI_SYSTEM_OWNER', 'RISK_COMPLIANCE_AUDITOR', 'GOVERNANCE_APPROVER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AiSystemStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('ASSISTIVE', 'HUMAN_IN_THE_LOOP', 'HUMAN_ON_THE_LOOP', 'AUTONOMOUS');

-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('IDEA', 'DEVELOPMENT', 'PILOT', 'PRODUCTION', 'RETIRED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ComplianceAuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ComplianceResult" AS ENUM ('CONFORMING', 'PARTIALLY_CONFORMING', 'NON_CONFORMING', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ControlImplementationStatus" AS ENUM ('RECOMMENDED', 'PLANNED', 'IMPLEMENTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GovernanceDecisionType" AS ENUM ('APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('SYSTEM_REGISTERED', 'ASSESSMENT_SUBMITTED', 'ASSESSMENT_VERIFIED', 'AUDIT_UPDATED', 'CONTROL_ASSIGNED', 'ACTION_UPDATED', 'SYSTEM_SUBMITTED', 'GOVERNANCE_DECISION_RECORDED', 'SYSTEM_SUSPENDED');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSystem" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "intendedUsers" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "modelProvider" TEXT,
    "modelName" TEXT,
    "lifecycleStage" "LifecycleStage" NOT NULL,
    "autonomyLevel" "AutonomyLevel" NOT NULL,
    "usesPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "usesSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "hasMaterialImpact" BOOLEAN NOT NULL DEFAULT false,
    "status" "AiSystemStatus" NOT NULL DEFAULT 'DRAFT',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "complianceScore" INTEGER NOT NULL DEFAULT 0,
    "lastAssessedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "departmentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "summary" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "aiSystemId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFactor" (
    "id" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "evidenceGuidance" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSystemControl" (
    "id" TEXT NOT NULL,
    "status" "ControlImplementationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "rationale" TEXT NOT NULL,
    "evidenceNote" TEXT,
    "aiSystemId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSystemControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAudit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ComplianceAuditStatus" NOT NULL DEFAULT 'PLANNED',
    "score" INTEGER,
    "summary" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "aiSystemId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "result" "ComplianceResult" NOT NULL,
    "finding" TEXT,
    "evidence" TEXT,
    "auditId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ActionPriority" NOT NULL,
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "aiSystemId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceDecision" (
    "id" TEXT NOT NULL,
    "decision" "GovernanceDecisionType" NOT NULL,
    "justification" TEXT NOT NULL,
    "conditions" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiSystemId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,

    CONSTRAINT "GovernanceDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "summary" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiSystemId" TEXT,
    "actorId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AiSystem_referenceId_key" ON "AiSystem"("referenceId");

-- CreateIndex
CREATE INDEX "AiSystem_departmentId_idx" ON "AiSystem"("departmentId");

-- CreateIndex
CREATE INDEX "AiSystem_ownerId_idx" ON "AiSystem"("ownerId");

-- CreateIndex
CREATE INDEX "AiSystem_status_riskLevel_idx" ON "AiSystem"("status", "riskLevel");

-- CreateIndex
CREATE INDEX "AiSystem_createdAt_idx" ON "AiSystem"("createdAt");

-- CreateIndex
CREATE INDEX "RiskAssessment_assessorId_idx" ON "RiskAssessment"("assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_aiSystemId_version_key" ON "RiskAssessment"("aiSystemId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RiskFactor_assessmentId_ruleKey_key" ON "RiskFactor"("assessmentId", "ruleKey");

-- CreateIndex
CREATE UNIQUE INDEX "Control_code_key" ON "Control"("code");

-- CreateIndex
CREATE INDEX "AiSystemControl_controlId_idx" ON "AiSystemControl"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "AiSystemControl_aiSystemId_controlId_key" ON "AiSystemControl"("aiSystemId", "controlId");

-- CreateIndex
CREATE INDEX "ComplianceAudit_aiSystemId_status_idx" ON "ComplianceAudit"("aiSystemId", "status");

-- CreateIndex
CREATE INDEX "ComplianceAudit_auditorId_idx" ON "ComplianceAudit"("auditorId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_controlId_idx" ON "ComplianceCheck"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceCheck_auditId_controlId_key" ON "ComplianceCheck"("auditId", "controlId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_aiSystemId_status_idx" ON "CorrectiveAction"("aiSystemId", "status");

-- CreateIndex
CREATE INDEX "CorrectiveAction_assigneeId_status_idx" ON "CorrectiveAction"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "GovernanceDecision_aiSystemId_decidedAt_idx" ON "GovernanceDecision"("aiSystemId", "decidedAt");

-- CreateIndex
CREATE INDEX "GovernanceDecision_approverId_idx" ON "GovernanceDecision"("approverId");

-- CreateIndex
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_aiSystemId_occurredAt_idx" ON "AuditEvent"("aiSystemId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSystem" ADD CONSTRAINT "AiSystem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSystem" ADD CONSTRAINT "AiSystem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFactor" ADD CONSTRAINT "RiskFactor_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSystemControl" ADD CONSTRAINT "AiSystemControl_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSystemControl" ADD CONSTRAINT "AiSystemControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "ComplianceAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDecision" ADD CONSTRAINT "GovernanceDecision_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceDecision" ADD CONSTRAINT "GovernanceDecision_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_aiSystemId_fkey" FOREIGN KEY ("aiSystemId") REFERENCES "AiSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
