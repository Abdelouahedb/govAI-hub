import { requireUser } from "@/lib/auth/permissions";
import { getLocale, tr } from "@/lib/i18n";
import type { UserRole } from "@/generated/prisma/enums";

type ManualRole = {
  id: UserRole;
  title: string;
  summary: string;
  responsibilities: string[];
};

function manualRoles(locale: "fr" | "en"): ManualRole[] {
  const isFrench = locale === "fr";

  return [
    {
      id: "ADMINISTRATOR",
      title: isFrench ? "Administrateur" : "Administrator",
      summary: isFrench
        ? "Maintient le bon fonctionnement de l’espace et attribue les accès adaptés à chaque personne."
        : "Keeps the workspace operating properly and gives each person the appropriate access.",
      responsibilities: isFrench
        ? ["Créer, mettre à jour et désactiver les comptes utilisateurs.", "Gérer tous les systèmes, contrôles et éléments de suivi.", "Consulter l’ensemble des informations de gouvernance."]
        : ["Create, update, and deactivate user accounts.", "Manage all systems, controls, and follow-up items.", "Review all governance information."],
    },
    {
      id: "AI_SYSTEM_OWNER",
      title: isFrench ? "Propriétaire du système IA" : "AI System Owner",
      summary: isFrench
        ? "Porte la responsabilité opérationnelle d’un système IA et tient son dossier à jour."
        : "Owns the operational responsibility for an AI system and keeps its record current.",
      responsibilities: isFrench
        ? ["Enregistrer un système et documenter son usage, ses données et son contexte.", "Réaliser l’évaluation des risques et répondre aux actions qui lui sont confiées.", "Déclarer les incidents liés à ses systèmes."]
        : ["Register a system and document its use, data, and context.", "Complete the risk assessment and respond to assigned actions.", "Report incidents related to their systems."],
    },
    {
      id: "RISK_COMPLIANCE_AUDITOR",
      title: isFrench ? "Auditeur risques et conformité" : "Risk & Compliance Auditor",
      summary: isFrench
        ? "Vérifie que l’évaluation, les contrôles et les preuves permettent une revue fiable."
        : "Checks that the assessment, controls, and evidence support a reliable review.",
      responsibilities: isFrench
        ? ["Vérifier les évaluations de risques soumises.", "Réaliser les audits de conformité et enregistrer les constats.", "Créer des actions correctives et recommander une décision de gouvernance."]
        : ["Verify submitted risk assessments.", "Complete compliance audits and record findings.", "Create corrective actions and recommend a governance decision."],
    },
    {
      id: "GOVERNANCE_APPROVER",
      title: isFrench ? "Approbateur de gouvernance" : "Governance Approver",
      summary: isFrench
        ? "Prend la décision humaine finale sur la base du dossier et de ses éléments de preuve."
        : "Makes the final human decision using the record and its supporting evidence.",
      responsibilities: isFrench
        ? ["Examiner le registre, les risques, les contrôles, les actions et les recommandations.", "Enregistrer une approbation, une approbation conditionnelle, un rejet ou une suspension.", "Suivre les incidents et consulter la trace des décisions."]
        : ["Review the register, risks, controls, actions, and recommendations.", "Record an approval, conditional approval, rejection, or suspension.", "Follow incidents and consult the decision trail."],
    },
    {
      id: "VIEWER",
      title: isFrench ? "Lecteur" : "Viewer",
      summary: isFrench
        ? "Consulte l’état de la gouvernance sans modifier les dossiers."
        : "Reviews governance status without changing records.",
      responsibilities: isFrench
        ? ["Consulter la vue d’ensemble et le registre des systèmes.", "Accéder aux informations de référence sans créer ni modifier d’élément."]
        : ["View the overview and system registry.", "Access reference information without creating or changing records."],
    },
  ];
}

export default async function ManualPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const roles = manualRoles(locale);
  const currentRole = roles.find((role) => role.id === user.role)?.title ?? user.role;

  return (
    <article className="app-page manual-page">
      <header className="manual-heading">
        <h1>{tr(locale, "Manuel d’utilisation", "User guide")}</h1>
        <p>{tr(locale, "Ce guide explique qui intervient dans GovAI Hub et ce que chaque rôle peut faire. Les accès sont attribués pour que chaque étape reste rattachée à une personne responsable.", "This guide explains who works in GovAI Hub and what each role can do. Access is assigned so every step remains connected to a responsible person.")}</p>
      </header>

      <section className="manual-overview" aria-labelledby="manual-overview-title">
        <h2 id="manual-overview-title">{tr(locale, "Comment lire ce guide", "How to use this guide")}</h2>
        <p>{tr(locale, "Votre rôle actuel est mis en évidence dans votre profil. Les responsabilités ci-dessous décrivent les principales actions autorisées, pas des conseils juridiques ni une certification.", "Your current role is shown in your profile. The responsibilities below describe the main permitted actions, not legal advice or a certification.")}</p>
      </section>

      <section className="manual-roles" aria-labelledby="manual-roles-title">
        <div className="manual-roles-heading">
          <h2 id="manual-roles-title">{tr(locale, "Rôles et responsabilités", "Roles and responsibilities")}</h2>
          <p>{tr(locale, `Votre rôle : ${currentRole}`, `Your role: ${currentRole}`)}</p>
        </div>
        {roles.map((role) => (
          <section className="manual-role" key={role.title}>
            <div className="manual-role-title">
              <span>{tr(locale, "Rôle", "Role")}</span>
              <h3>{role.title}</h3>
            </div>
            <div className="manual-role-content">
              <p>{role.summary}</p>
              <ul>{role.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}</ul>
            </div>
          </section>
        ))}
      </section>

      <p className="manual-note">{tr(locale, "En cas de doute sur un accès ou une responsabilité, contactez un administrateur avant de poursuivre une action dans le dossier.", "If you are unsure about an access right or responsibility, contact an administrator before continuing an action in the record.")}</p>
    </article>
  );
}
