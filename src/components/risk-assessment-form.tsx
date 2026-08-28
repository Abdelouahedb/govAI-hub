"use client";

import { useActionState } from "react";
import { CheckCircle, ShieldWarning } from "@phosphor-icons/react";
import { submitRiskAssessmentAction, type RiskAssessmentFormState } from "@/app/actions/risk-assessments";
import type { Locale } from "@/lib/i18n";

const scoredQuestions = [
  { name: "usesSensitiveData", label: ["Le système traite des données personnelles sensibles.", "The system processes sensitive personal data."], help: ["Exemples : données de santé, biométriques, origine ethnique, religion ou appartenance syndicale.", "Examples include health information, biometric data, data about ethnicity, religion, or union membership."], points: 20 },
  { name: "affectsIndividuals", label: ["Le système peut avoir un effet significatif sur une personne.", "The system can materially affect an individual."], help: ["Par exemple : emploi, crédit, logement, éducation, santé ou services essentiels.", "For example, it can influence access to employment, credit, housing, education, healthcare, or essential services."], points: 25 },
  { name: "makesAutonomousDecisions", label: ["Le système prend ou exécute de façon autonome des décisions importantes.", "The system makes or executes consequential decisions autonomously."], help: ["Sélectionnez cette option lorsqu’aucune décision humaine significative n’intervient à ce moment-là.", "Select this when the system can determine an outcome without a meaningful human decision at that point."], points: 20 },
  { name: "lacksHumanReview", label: ["Aucune revue humaine formelle n’a lieu avant l’utilisation d’un résultat important.", "There is no formal human review before consequential outcomes are used."], help: ["La simple surveillance d’un tableau de bord ne suffit pas : une personne doit disposer d’un pouvoir de contrôle et de dérogation documenté.", "A person merely monitoring a dashboard is not enough; they need authority and a documented override path."], points: 15 },
  { name: "lacksExplanation", label: ["L’organisation ne peut pas fournir des explications compréhensibles pour les résultats importants.", "The organization cannot provide understandable reasons for important outcomes."], help: ["Pensez au réviseur et à la personne concernée par la recommandation ou la décision.", "Consider both the reviewer and the person affected by the recommendation or decision."], points: 10 },
  { name: "lacksAppeal", label: ["Les personnes concernées ne disposent d’aucun mécanisme clair de recours ou de correction.", "Affected people have no clear appeal or correction mechanism."], help: ["Elles doivent pouvoir contester un résultat, corriger une information ou demander une revue.", "They should be able to contest an outcome, correct relevant information, or request review."], points: 10 },
] as const;

const controlQuestions = [
  { name: "lacksDataGovernance", label: ["Aucun processus de gouvernance des données n’est documenté pour ce système.", "There is no documented data-governance process for this system."], help: ["Vérifiez que les catégories de données, accès, conservation, suppression et responsabilités de qualité sont documentés.", "Confirm that data categories, access, retention, deletion, and data-quality responsibilities are documented."], control: "DATA-01" },
  { name: "lacksBiasTesting", label: ["Aucun processus documenté de test d’équité ou de biais n’existe.", "There is no documented fairness or bias-testing process."], help: ["Vérifiez que les tests de résultats, seuils, responsabilités d’enquête et mesures correctives sont définis.", "Consider whether outcome testing, thresholds, investigation responsibilities, and remediation are defined."], control: "FAIR-01" },
  { name: "lacksSecurityControls", label: ["Les contrôles de sécurité ne sont pas justifiés par des preuves.", "Security controls have not been evidenced for this system."], help: ["Vérifiez les restrictions d’accès, le développement sécurisé, les tests de vulnérabilité, la réponse aux incidents et les responsabilités de correction.", "Consider access restrictions, secure development, vulnerability testing, incident response, and responsibility for remediation."], control: "SEC-01" },
  { name: "lacksMonitoringPlan", label: ["Aucun plan documenté de surveillance et d’escalade n’existe.", "There is no documented monitoring and escalation plan."], help: ["Vérifiez les changements de performance, dérive, mauvais usage, incidents, fréquence de suivi et contacts d’escalade.", "Consider performance changes, drift, misuse, incidents, monitoring frequency, and escalation contacts."], control: "MON-01" },
] as const;

type QuestionName = (typeof scoredQuestions)[number]["name"] | (typeof controlQuestions)[number]["name"];

type RiskAssessmentFormProps = {
  locale: Locale;
  systemId: string;
  systemName: string;
  defaultValues: Record<QuestionName, boolean>;
};

export function RiskAssessmentForm({ locale, systemId, systemName, defaultValues }: RiskAssessmentFormProps) {
  const [state, formAction, pending] = useActionState<RiskAssessmentFormState, FormData>(submitRiskAssessmentAction, undefined);

  return (
    <form action={formAction} className="workspace-form assessment-form" noValidate>
      <input type="hidden" name="systemId" value={systemId} />
      <div className="assessment-intro">
        <ShieldWarning size={24} weight="fill" />
        <div><h2>{locale === "fr" ? `Réponses pour ${systemName}` : `Answer for ${systemName}`}</h2><p>{locale === "fr" ? "Les facteurs de risque calculent le score de 0 à 100. Les contrôles de préparation recommandent des mesures, sans modifier le score." : "Risk drivers calculate the 0–100 score. Control-readiness checks add recommended safeguards, but do not change that score."}</p></div>
      </div>
      <div className="question-list">
        <div className="question-section-heading"><h3>{locale === "fr" ? "Facteurs de risque" : "Risk drivers"}</h3><p>{locale === "fr" ? "Sélectionnez chaque affirmation applicable. Les points affichés contribuent directement au score publié." : "Select each statement that applies. The displayed points contribute directly to the published score."}</p></div>
        {scoredQuestions.map((question) => (
          <label className="risk-question" key={question.name}>
            <input type="checkbox" name={question.name} defaultChecked={defaultValues[question.name]} />
            <span><strong>{question.label[locale === "fr" ? 0 : 1]} <em>+{question.points}</em></strong><small>{question.help[locale === "fr" ? 0 : 1]}</small></span>
          </label>
        ))}
        <div className="question-section-heading"><h3>{locale === "fr" ? "Vérifications de préparation des contrôles" : "Control-readiness checks"}</h3><p>{locale === "fr" ? "Sélectionnez une affirmation lorsque la preuve ou le processus est absent. Ces réponses recommandent des contrôles, sans ajouter de points." : "Select a statement when the evidence or process is missing. These answers recommend controls; they do not add score points."}</p></div>
        {controlQuestions.map((question) => (
          <label className="risk-question control-question" key={question.name}>
            <input type="checkbox" name={question.name} defaultChecked={defaultValues[question.name]} />
            <span><strong>{question.label[locale === "fr" ? 0 : 1]} <em>{locale === "fr" ? "Recommande" : "Recommends"} {question.control}</em></strong><small>{question.help[locale === "fr" ? 0 : 1]}</small></span>
          </label>
        ))}
      </div>
      <p className="assessment-note"><CheckCircle size={18} weight="fill" />{locale === "fr" ? " Le score est calculé localement à partir de règles publiées. Aucun service d’IA externe n’interprète vos réponses et chaque réponse est conservée pour la revue." : " The score is calculated locally from published rules. No external AI service interprets your answers, and every response is saved for review."}</p>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? (locale === "fr" ? "Enregistrement de l’évaluation…" : "Saving assessment…") : (locale === "fr" ? "Calculer et enregistrer l’évaluation" : "Calculate and save assessment")}</button>
    </form>
  );
}
