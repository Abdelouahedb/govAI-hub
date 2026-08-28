"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

const createSystemSchema = z.object({
  name: z.string().trim().min(3, "Enter a system name of at least 3 characters.").max(120),
  description: z.string().trim().min(20, "Describe the system in at least 20 characters.").max(2000),
  purpose: z.string().trim().min(10, "Explain the purpose in at least 10 characters.").max(1000),
  intendedUsers: z.string().trim().min(3, "Specify the intended users.").max(500),
  dataCategories: z.array(z.string().trim().min(1)).min(1, "Add at least one data category."),
  lifecycleStage: z.enum(["IDEA", "DEVELOPMENT", "PILOT", "PRODUCTION", "RETIRED"]),
  autonomyLevel: z.enum(["ASSISTIVE", "HUMAN_IN_THE_LOOP", "HUMAN_ON_THE_LOOP", "AUTONOMOUS"]),
  departmentId: z.string().trim().min(1, "Select a department."),
  modelProvider: z.string().trim().max(120).optional(),
  modelName: z.string().trim().max(120).optional(),
  usesPersonalData: z.boolean(),
  usesSensitiveData: z.boolean(),
  hasMaterialImpact: z.boolean(),
});

function checked(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

function dataCategories(formData: FormData) {
  return String(formData.get("dataCategories") ?? "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export type SystemFormState = { error?: string } | undefined;

export async function createAiSystemAction(
  _previousState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const owner = await requirePermission("registry:create");
  const parsed = createSystemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    intendedUsers: formData.get("intendedUsers"),
    dataCategories: dataCategories(formData),
    lifecycleStage: formData.get("lifecycleStage"),
    autonomyLevel: formData.get("autonomyLevel"),
    departmentId: formData.get("departmentId"),
    modelProvider: formData.get("modelProvider") || undefined,
    modelName: formData.get("modelName") || undefined,
    usesPersonalData: checked(formData, "usesPersonalData"),
    usesSensitiveData: checked(formData, "usesSensitiveData"),
    hasMaterialImpact: checked(formData, "hasMaterialImpact"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the submitted information." };
  }

  if (owner.role !== "ADMINISTRATOR" && owner.departmentId !== parsed.data.departmentId) {
    return { error: "You can only register systems for your own department." };
  }

  const referenceId = `AI-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const system = await getDb().$transaction(async (tx) => {
    const created = await tx.aiSystem.create({
      data: {
        referenceId,
        name: parsed.data.name,
        description: parsed.data.description,
        purpose: parsed.data.purpose,
        intendedUsers: parsed.data.intendedUsers,
        dataCategories: parsed.data.dataCategories,
        lifecycleStage: parsed.data.lifecycleStage,
        autonomyLevel: parsed.data.autonomyLevel,
        departmentId: parsed.data.departmentId,
        ownerId: owner.id,
        modelProvider: parsed.data.modelProvider || null,
        modelName: parsed.data.modelName || null,
        usesPersonalData: parsed.data.usesPersonalData,
        usesSensitiveData: parsed.data.usesSensitiveData,
        hasMaterialImpact: parsed.data.hasMaterialImpact,
      },
    });
    await tx.auditEvent.create({
      data: {
        eventType: "SYSTEM_REGISTERED",
        summary: `${created.referenceId} registered by ${owner.name}`,
        entityType: "AiSystem",
        entityId: created.id,
        aiSystemId: created.id,
        actorId: owner.id,
        metadata: { departmentId: created.departmentId, lifecycleStage: created.lifecycleStage },
      },
    });
    return created;
  });

  revalidatePath("/systems");
  redirect(`/systems/${system.id}`);
}
