import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { getGovernanceDashboard } from "@/lib/data/governance-dashboard";
import { getLocale } from "@/lib/i18n";
import { createGovernanceReport } from "@/lib/reports/governance-report";

export const runtime = "nodejs";

export async function GET() {
  await requirePermission("dashboard:view");
  const [data, locale] = await Promise.all([getGovernanceDashboard(), getLocale()]);
  const bytes = await createGovernanceReport(data, locale);
  const responseBytes = new Uint8Array(bytes.byteLength);
  responseBytes.set(bytes);
  return new NextResponse(new Blob([responseBytes.buffer]), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="govai-governance-report-${data.generatedAt.toISOString().slice(0, 10)}.pdf"`, "Cache-Control": "no-store" } });
}
