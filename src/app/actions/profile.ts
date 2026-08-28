"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

const profileNameSchema = z.object({
  name: z.string().trim().min(2, "Enter a name of at least 2 characters.").max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  password: z.string().min(12, "Use a password with at least 12 characters."),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "The new passwords do not match.",
  path: ["confirmPassword"],
});

const avatarDataUrlSchema = z.string()
  .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Choose a PNG, JPEG, or WebP image.")
  .max(700_000, "Choose an image smaller than 512 KB.");

export type ProfileActionState = { error?: string; success?: string } | undefined;

function refreshProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

export async function updateProfileNameAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = profileNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the name." };
  }

  const db = getDb();
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } }),
    db.auditEvent.create({
      data: {
        eventType: "AUDIT_UPDATED",
        summary: "User profile name updated",
        entityType: "User",
        entityId: user.id,
        actorId: user.id,
      },
    }),
  ], { maxWait: 10_000, timeout: 20_000 });

  refreshProfilePaths();
  return { success: "Your name has been updated." };
}

export async function updateProfileAvatarAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const removeAvatar = formData.get("removeAvatar") === "true";
  const submittedAvatar = formData.get("avatarDataUrl");

  if (!removeAvatar) {
    const parsed = avatarDataUrlSchema.safeParse(submittedAvatar);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Choose a valid profile photo." };
    }

    const db = getDb();
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { avatarDataUrl: parsed.data } }),
      db.auditEvent.create({ data: { eventType: "AUDIT_UPDATED", summary: "User profile photo updated", entityType: "User", entityId: user.id, actorId: user.id } }),
    ], { maxWait: 10_000, timeout: 20_000 });
    refreshProfilePaths();
    return { success: "Your profile photo has been updated." };
  }

  const db = getDb();
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { avatarDataUrl: null } }),
    db.auditEvent.create({ data: { eventType: "AUDIT_UPDATED", summary: "User profile photo removed", entityType: "User", entityId: user.id, actorId: user.id } }),
  ], { maxWait: 10_000, timeout: 20_000 });
  refreshProfilePaths();
  return { success: "Your profile photo has been removed." };
}

export async function changePasswordAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the password fields." };
  }

  const account = await getDb().user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!account?.passwordHash || !(await compare(parsed.data.currentPassword, account.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const db = getDb();
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.auditEvent.create({ data: { eventType: "AUDIT_UPDATED", summary: "User password changed", entityType: "User", entityId: user.id, actorId: user.id } }),
  ], { maxWait: 10_000, timeout: 20_000 });

  return { success: "Your password has been changed." };
}
