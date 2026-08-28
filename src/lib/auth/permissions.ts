import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/auth/roles";

export class AuthorizationError extends Error {
  constructor(permission: Permission) {
    super(`Permission required: ${permission}`);
    this.name = "AuthorizationError";
  }
}

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return getDb().user.findFirst({
    where: { id: session.user.id, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      avatarDataUrl: true,
      role: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError(permission);
  }

  return user;
}
