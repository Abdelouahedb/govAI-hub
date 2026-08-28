import { describe, expect, it } from "vitest";
import { recommendControls } from "./risk-controls";

describe("recommendControls", () => {
  it("deduplicates controls triggered by several rules", () => {
    const controls = recommendControls({
      usesSensitiveData: true,
      affectsIndividuals: true,
      makesAutonomousDecisions: true,
      lacksHumanReview: true,
      lacksExplanation: true,
      lacksAppeal: true,
      lacksDataGovernance: true,
      lacksBiasTesting: true,
      lacksSecurityControls: true,
      lacksMonitoringPlan: true,
    });

    expect(controls.map((control) => control.code)).toEqual(["DATA-01", "RISK-01", "FAIR-01", "HUM-01", "TRN-01", "HUM-02", "SEC-01", "MON-01"]);
  });

  it("does not recommend controls when no risk rule is triggered", () => {
    expect(recommendControls({ usesSensitiveData: false, affectsIndividuals: false, makesAutonomousDecisions: false, lacksHumanReview: false, lacksExplanation: false, lacksAppeal: false, lacksDataGovernance: false, lacksBiasTesting: false, lacksSecurityControls: false, lacksMonitoringPlan: false })).toEqual([]);
  });
});
