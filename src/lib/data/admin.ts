import { getDb } from "@/lib/db";

export async function getDepartments() {
  return getDb().department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });
}

export async function getUsersForAdministration() {
  return getDb().user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      departmentId: true,
      department: { select: { name: true, code: true } },
      createdAt: true,
    },
  });
}
