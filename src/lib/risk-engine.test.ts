import { describe, expect, it } from "vitest";
import { assessRisk, classifyRisk, initialRecruitAiInput } from "./risk-engine";

describe("classifyRisk", () => {
  it.each([
    [0, "Low"],
    [25, "Low"],
    [26, "Moderate"],
    [50, "Moderate"],
    [51, "High"],
    [75, "High"],
    [76, "Critical"],
    [100, "Critical"],
  ] as const)("classifies %i as %s", (score, expected) => {
    expect(classifyRisk(score)).toBe(expected);
  });
});

describe("assessRisk", () => {
  it("produces the explainable RecruitAI score", () => {
    const result = assessRisk(initialRecruitAiInput);

    expect(result.score).toBe(85);
    expect(result.level).toBe("Critical");
    expect(result.contributions.reduce((sum, factor) => sum + factor.points, 0)).toBe(result.score);
    expect(result.contributions.map((factor) => factor.key)).toEqual([
      "usesSensitiveData",
      "affectsIndividuals",
      "makesAutonomousDecisions",
      "lacksExplanation",
      "lacksAppeal",
    ]);
  });

  it("returns no controls when no risk rule is triggered", () => {
    const result = assessRisk({
      usesSensitiveData: false,
      affectsIndividuals: false,
      makesAutonomousDecisions: false,
      lacksHumanReview: false,
      lacksExplanation: false,
      lacksAppeal: false,
    });

    expect(result).toMatchObject({ score: 0, level: "Low", contributions: [] });
  });
});
