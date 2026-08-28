import type { GovernanceAssessmentInput } from "./risk-assessment-model";

type ControlRecommendation = {
  code: string;
  rationale: string;
};

const controlRecommendations: Partial<Record<keyof GovernanceAssessmentInput, readonly ControlRecommendation[]>> = {
  usesSensitiveData: [
    { code: "DATA-01", rationale: "Sensitive personal data requires documented purpose, access, retention, and deletion safeguards." },
  ],
  affectsIndividuals: [
    { code: "RISK-01", rationale: "A system that can materially affect people needs an impact assessment before use." },
    { code: "FAIR-01", rationale: "Material individual impact requires proportionate bias monitoring and escalation thresholds." },
  ],
  makesAutonomousDecisions: [
    { code: "HUM-01", rationale: "Autonomous decisions need explicit human authority to intervene, override, or stop outcomes." },
  ],
  lacksHumanReview: [
    { code: "HUM-01", rationale: "No formal human review was reported; assign a trained reviewer and override process." },
  ],
  lacksExplanation: [
    { code: "TRN-01", rationale: "Insufficient explanations require understandable reasons for outcomes and recommendations." },
  ],
  lacksAppeal: [
    { code: "HUM-02", rationale: "People affected by an outcome need a clear route to question, correct, or appeal it." },
  ],
  lacksDataGovernance: [
    { code: "DATA-01", rationale: "Data governance evidence is incomplete; document the data inventory, access, retention, and deletion rules." },
  ],
  lacksBiasTesting: [
    { code: "FAIR-01", rationale: "No documented fairness testing was reported; define relevant groups, measures, thresholds, and remediation steps." },
  ],
  lacksSecurityControls: [
    { code: "SEC-01", rationale: "Security controls are not evidenced; define access restrictions, testing, incident response, and vulnerability ownership." },
  ],
  lacksMonitoringPlan: [
    { code: "MON-01", rationale: "No monitoring plan was reported; define performance, drift, incident, and escalation monitoring." },
  ],
};

export function recommendControls(input: GovernanceAssessmentInput) {
  const recommendations = new Map<string, string>();

  for (const [key, enabled] of Object.entries(input) as Array<[keyof GovernanceAssessmentInput, boolean]>) {
    if (!enabled) continue;
    for (const recommendation of controlRecommendations[key] ?? []) {
      recommendations.set(recommendation.code, recommendation.rationale);
    }
  }

  return [...recommendations].map(([code, rationale]) => ({ code, rationale }));
}
