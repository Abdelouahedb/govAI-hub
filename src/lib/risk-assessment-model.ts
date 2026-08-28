import type { RiskInput } from "./risk-engine";

/** Evidence gaps inform recommended controls; they do not change the published 0–100 score. */
export type ControlReadinessInput = {
  lacksDataGovernance: boolean;
  lacksBiasTesting: boolean;
  lacksSecurityControls: boolean;
  lacksMonitoringPlan: boolean;
};

export type GovernanceAssessmentInput = RiskInput & ControlReadinessInput;

export const scoredQuestionKeys = [
  "usesSensitiveData",
  "affectsIndividuals",
  "makesAutonomousDecisions",
  "lacksHumanReview",
  "lacksExplanation",
  "lacksAppeal",
] as const satisfies readonly (keyof RiskInput)[];

export const controlReadinessKeys = [
  "lacksDataGovernance",
  "lacksBiasTesting",
  "lacksSecurityControls",
  "lacksMonitoringPlan",
] as const satisfies readonly (keyof ControlReadinessInput)[];
