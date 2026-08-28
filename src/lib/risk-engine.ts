export type RiskInput = {
  usesSensitiveData: boolean;
  affectsIndividuals: boolean;
  makesAutonomousDecisions: boolean;
  lacksHumanReview: boolean;
  lacksExplanation: boolean;
  lacksAppeal: boolean;
};

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type RiskRule = {
  key: keyof RiskInput;
  points: number;
  factor: string;
  recommendation: string;
};

export const riskRules: readonly RiskRule[] = [
  {
    key: "usesSensitiveData",
    points: 20,
    factor: "Sensitive personal data",
    recommendation: "Document the lawful purpose, access controls, and retention period.",
  },
  {
    key: "affectsIndividuals",
    points: 25,
    factor: "Material impact on people",
    recommendation: "Complete an impact assessment before deployment.",
  },
  {
    key: "makesAutonomousDecisions",
    points: 20,
    factor: "Autonomous decision-making",
    recommendation: "Define decisions that must remain under human authority.",
  },
  {
    key: "lacksHumanReview",
    points: 15,
    factor: "No human review",
    recommendation: "Add a named reviewer and a documented override process.",
  },
  {
    key: "lacksExplanation",
    points: 10,
    factor: "Insufficient explanation",
    recommendation: "Provide understandable reasons for recommendations or decisions.",
  },
  {
    key: "lacksAppeal",
    points: 10,
    factor: "No appeal mechanism",
    recommendation: "Create a clear process for users to contest an outcome.",
  },
];

export function classifyRisk(score: number): RiskLevel {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Moderate";
  return "Low";
}

export function assessRisk(input: RiskInput) {
  const triggeredRules = riskRules.filter((rule) => input[rule.key]);
  const score = triggeredRules.reduce((total, rule) => total + rule.points, 0);

  return {
    score,
    level: classifyRisk(score),
    contributions: triggeredRules.map(({ key, points, factor, recommendation }) => ({
      key,
      points,
      factor,
      recommendation,
    })),
    factors: triggeredRules.map((rule) => rule.factor),
    recommendations: triggeredRules.map((rule) => rule.recommendation),
  };
}

export const initialRecruitAiInput: RiskInput = {
  usesSensitiveData: true,
  affectsIndividuals: true,
  makesAutonomousDecisions: true,
  lacksHumanReview: false,
  lacksExplanation: true,
  lacksAppeal: true,
};
