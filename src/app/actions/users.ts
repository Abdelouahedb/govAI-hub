"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name of at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().trim().optional(),
  password: z.string().min(12, "Use a password with at least 12 characters."),
});

const updateUserSchema = z.object({
  userId: z.string().min(1, "Choose a user account."),
  name: z.string().trim().min(2, "Enter a name of at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().trim().optional(),
});

const resetUserPasswordSchema = z.object({
  userId: z.string().min(1, "Choose a user account."),
  password: z.string().min(12, "Use a temporary password with at least 12 characters."),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "The temporary passwords do not match.",
  path: ["confirmPassword"],
});

export type UserFormState = { error?: string; success?: string } | undefined;

export async function createUserAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const actor = await requirePermission("users:manage");
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the submitted information." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  try {
    await getDb().$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          departmentId: parsed.data.departmentId || null,
          passwordHash,
        },
      });
      await tx.auditEvent.create({
        data: {
          eventType: "USER_CREATED",
          summary: `User account created for ${user.name}`,
          entityType: "User",
          entityId: user.id,
          actorId: actor.id,
          metadata: { role: user.role, departmentId: user.departmentId },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  return { success: "User account created." };
}

export async function updateUserAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const actor = await requirePermission("users:manage");
  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the submitted information." };
  }

  const active = formData.get("active") === "true";
  const db = getDb();
  const current = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, email: true, role: true, departmentId: true, active: true },
  });

  if (!current) return { error: "This account no longer exists." };
  if (current.id === actor.id && (current.role !== parsed.data.role || current.active !== active)) {
    return { error: "Another administrator must change your own role or access status." };
  }

  const removesLastAdministrator = current.role === UserRole.ADMINISTRATOR
    && current.active
    && (parsed.data.role !== UserRole.ADMINISTRATOR || !active);
  if (removesLastAdministrator) {
    const activeAdministrators = await db.user.count({ where: { role: UserRole.ADMINISTRATOR, active: true } });
    if (activeAdministrators <= 1) return { error: "Keep at least one active administrator on the platform." };
  }

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: current.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          departmentId: parsed.data.departmentId || null,
          active,
        },
      });
      await tx.auditEvent.create({
        data: {
          eventType: "AUDIT_UPDATED",
          summary: `User access updated for ${user.name}`,
          entityType: "User",
          entityId: user.id,
          actorId: actor.id,
          metadata: {
            previous: { role: current.role, departmentId: current.departmentId, active: current.active },
            current: { role: user.role, departmentId: user.departmentId, active: user.active },
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
  return { success: "User account updated." };
}

export async function resetUserPasswordAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const actor = await requirePermission("users:manage");
  const parsed = resetUserPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the temporary password." };
  }

  const db = getDb();
  const account = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true },
  });

  if (!account) return { error: "This account no longer exists." };

  const passwordHash = await hash(parsed.data.password, 12);
  await db.$transaction([
    db.user.update({ where: { id: account.id }, data: { passwordHash } }),
    db.auditEvent.create({
      data: {
        eventType: "AUDIT_UPDATED",
        summary: "User password reset by administrator",
        entityType: "User",
        entityId: account.id,
        actorId: actor.id,
        metadata: { resetFor: account.name },
      },
    }),
  ], { maxWait: 10_000, timeout: 20_000 });

  revalidatePath("/admin/users");
  return { success: "Temporary password saved. Share it with the account holder through a secure channel." };
}
