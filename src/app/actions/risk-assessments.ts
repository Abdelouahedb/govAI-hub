"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { assessRisk, type RiskInput } from "@/lib/risk-engine";
import { recommendControls } from "@/lib/risk-controls";
import type { GovernanceAssessmentInput } from "@/lib/risk-assessment-model";

const riskAssessmentSchema = z.object({
  systemId: z.string().min(1),
  usesSensitiveData: z.boolean(),
  affectsIndividuals: z.boolean(),
  makesAutonomousDecisions: z.boolean(),
  lacksHumanReview: z.boolean(),
  lacksExplanation: z.boolean(),
  lacksAppeal: z.boolean(),
  lacksDataGovernance: z.boolean(),
  lacksBiasTesting: z.boolean(),
  lacksSecurityControls: z.boolean(),
  lacksMonitoringPlan: z.boolean(),
});

export type RiskAssessmentFormState = { error?: string } | undefined;

function isChecked(formData: FormData, field: keyof GovernanceAssessmentInput) {
  return formData.get(field) === "on";
}

export async function submitRiskAssessmentAction(
  _previousState: RiskAssessmentFormState,
  formData: FormData,
): Promise<RiskAssessmentFormState> {
  const actor = await requirePermission("assessment:complete");
  const input = {
    systemId: String(formData.get("systemId") ?? ""),
    usesSensitiveData: isChecked(formData, "usesSensitiveData"),
    affectsIndividuals: isChecked(formData, "affectsIndividuals"),
    makesAutonomousDecisions: isChecked(formData, "makesAutonomousDecisions"),
    lacksHumanReview: isChecked(formData, "lacksHumanReview"),
    lacksExplanation: isChecked(formData, "lacksExplanation"),
    lacksAppeal: isChecked(formData, "lacksAppeal"),
    lacksDataGovernance: isChecked(formData, "lacksDataGovernance"),
    lacksBiasTesting: isChecked(formData, "lacksBiasTesting"),
    lacksSecurityControls: isChecked(formData, "lacksSecurityControls"),
    lacksMonitoringPlan: isChecked(formData, "lacksMonitoringPlan"),
  };
  const parsed = riskAssessmentSchema.safeParse(input);
  if (!parsed.success) return { error: "The submitted assessment was not valid." };

  const system = await getDb().aiSystem.findUnique({
    where: { id: parsed.data.systemId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!system) return { error: "This AI system no longer exists." };
  if (actor.role !== "ADMINISTRATOR" && system.ownerId !== actor.id) {
    return { error: "Only the system owner can complete this assessment." };
  }
  if (system.status === "REJECTED" || system.status === "SUSPENDED") {
    return { error: "A rejected or suspended system cannot be assessed until its status changes." };
  }

  const riskInput: RiskInput = {
    usesSensitiveData: parsed.data.usesSensitiveData,
    affectsIndividuals: parsed.data.affectsIndividuals,
    makesAutonomousDecisions: parsed.data.makesAutonomousDecisions,
    lacksHumanReview: parsed.data.lacksHumanReview,
    lacksExplanation: parsed.data.lacksExplanation,
    lacksAppeal: parsed.data.lacksAppeal,
  };
  const result = assessRisk(riskInput);
  const assessmentInput: GovernanceAssessmentInput = { ...riskInput, lacksDataGovernance: parsed.data.lacksDataGovernance, lacksBiasTesting: parsed.data.lacksBiasTesting, lacksSecurityControls: parsed.data.lacksSecurityControls, lacksMonitoringPlan: parsed.data.lacksMonitoringPlan };
  const controls = recommendControls(assessmentInput);

  await getDb().$transaction(async (tx) => {
    const latest = await tx.riskAssessment.findFirst({
      where: { aiSystemId: system.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const assessment = await tx.riskAssessment.create({
      data: {
        aiSystemId: system.id,
        assessorId: actor.id,
        version: (latest?.version ?? 0) + 1,
        status: "SUBMITTED",
        answers: assessmentInput,
        score: result.score,
        riskLevel: result.level.toUpperCase() as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
        summary: `${result.level} risk: ${result.score}/100 from ${result.contributions.length} triggered rule${result.contributions.length === 1 ? "" : "s"}.`,
        submittedAt: new Date(),
        triggeredFactors: { create: result.contributions.map((factor) => ({ ruleKey: factor.key, label: factor.factor, points: factor.points, recommendation: factor.recommendation })) },
      },
    });
    await tx.aiSystem.update({
      where: { id: system.id },
      data: {
        riskScore: result.score,
        riskLevel: result.level.toUpperCase() as "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
        lastAssessedAt: new Date(),
        status: "IN_REVIEW",
      },
    });
    if (controls.length) {
      const availableControls = await tx.control.findMany({ where: { code: { in: controls.map((control) => control.code) }, active: true }, select: { id: true, code: true } });
      await Promise.all(availableControls.map((control) => tx.aiSystemControl.upsert({
        where: { aiSystemId_controlId: { aiSystemId: system.id, controlId: control.id } },
        update: { rationale: controls.find((item) => item.code === control.code)?.rationale ?? "Recommended by risk assessment." },
        create: { aiSystemId: system.id, controlId: control.id, rationale: controls.find((item) => item.code === control.code)?.rationale ?? "Recommended by risk assessment." },
      })));
    }
    await tx.auditEvent.create({
      data: {
        eventType: "ASSESSMENT_SUBMITTED",
        summary: `Risk assessment submitted: ${result.score}/100 (${result.level})`,
        entityType: "RiskAssessment",
        entityId: assessment.id,
        aiSystemId: system.id,
        actorId: actor.id,
        metadata: { version: assessment.version, score: result.score, riskLevel: result.level, triggeredRules: result.contributions.map((factor) => factor.key), controlGaps: ["lacksDataGovernance", "lacksBiasTesting", "lacksSecurityControls", "lacksMonitoringPlan"].filter((key) => assessmentInput[key as keyof typeof assessmentInput]) },
      },
    });
  });

  revalidatePath("/systems");
  revalidatePath(`/systems/${system.id}`);
  redirect(`/systems/${system.id}`);
}
