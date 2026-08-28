import type { AiSystemStatus } from "@/generated/prisma/enums";

const statusDetails: Record<AiSystemStatus, { label: string; description: string; tone: "neutral" | "active" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Draft", description: "Registration is open; complete the risk assessment next.", tone: "neutral" },
  IN_REVIEW: { label: "In review", description: "Assessment is complete and the system is awaiting review.", tone: "active" },
  ACTION_REQUIRED: { label: "Action required", description: "Corrective actions must be addressed before approval.", tone: "warning" },
  APPROVED: { label: "Approved", description: "Governance approval is recorded for the current state.", tone: "success" },
  CONDITIONALLY_APPROVED: { label: "Conditionally approved", description: "Use is approved subject to recorded conditions.", tone: "warning" },
  REJECTED: { label: "Rejected", description: "The system cannot proceed under the current decision.", tone: "danger" },
  SUSPENDED: { label: "Suspended", description: "Use is paused until governance concerns are resolved.", tone: "danger" },
};

export function getStatusDetails(status: AiSystemStatus, locale: "fr" | "en" = "en") {
  const detail = statusDetails[status];
  if (locale === "en") return detail;
  const french: Record<AiSystemStatus, Pick<typeof detail, "label" | "description">> = {
    DRAFT: { label: "Brouillon", description: "L’enregistrement est ouvert ; complétez ensuite l’évaluation des risques." },
    IN_REVIEW: { label: "En cours de revue", description: "L’évaluation est terminée et le système attend une revue." },
    ACTION_REQUIRED: { label: "Action requise", description: "Des actions correctives doivent être traitées avant approbation." },
    APPROVED: { label: "Approuvé", description: "L’approbation de gouvernance est enregistrée pour l’état actuel." },
    CONDITIONALLY_APPROVED: { label: "Approuvé sous conditions", description: "L’utilisation est approuvée sous réserve des conditions enregistrées." },
    REJECTED: { label: "Rejeté", description: "Le système ne peut pas avancer selon la décision actuelle." },
    SUSPENDED: { label: "Suspendu", description: "L’utilisation est suspendue jusqu’à la résolution des préoccupations de gouvernance." },
  };
  return { ...detail, ...french[status] };
}

const frenchEnumLabels: Record<string, string> = {
  IDEA: "Idée",
  DEVELOPMENT: "Développement",
  PILOT: "Pilote",
  PRODUCTION: "Production",
  RETIRED: "Retiré",
  LOW: "Faible",
  MODERATE: "Modéré",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  CRITICAL: "Critique",
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloquée",
  COMPLETED: "Terminée",
  CLOSED: "Clôturée",
  REPORTED: "Signalé",
  INVESTIGATING: "En investigation",
  RESOLVED: "Résolu",
  HUMAN_IN_THE_LOOP: "Humain dans la boucle",
  HUMAN_ON_THE_LOOP: "Humain superviseur",
  FULLY_AUTONOMOUS: "Entièrement autonome",
};

export function readableEnum(value: string, locale: "fr" | "en" = "en") {
  if (locale === "fr" && frenchEnumLabels[value]) return frenchEnumLabels[value];
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
