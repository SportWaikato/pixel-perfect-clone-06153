import { describe, it, expect } from "vitest";
import {
  actualTotalMinutes,
  actualTotalHours,
  meetsSixHourGuideline,
  surveyMeetsGuideline,
  alignmentStatus,
  isTopTwoBox,
  countMultiSelectResponse,
  regionTotal,
  nationalTotal,
  anonymiseId,
} from "./movementCalculations";

describe("movementCalculations", () => {
  describe("actualTotalMinutes", () => {
    it("sums duration_minutes for activities in date range", () => {
      const activities = [
        { duration_minutes: 30, created_at: "2026-07-01T10:00:00Z" },
        { duration_minutes: 45, created_at: "2026-07-02T10:00:00Z" },
        { duration_minutes: 60, created_at: "2026-06-01T10:00:00Z" },
      ];
      expect(actualTotalMinutes(activities, "2026-07-01", "2026-07-31")).toBe(75);
    });
    it("returns 0 when no activities in range", () => {
      expect(actualTotalMinutes([], "2026-07-01", "2026-07-31")).toBe(0);
    });
    it("handles null/undefined duration_minutes", () => {
      const activities = [{ duration_minutes: null, created_at: "2026-07-01T10:00:00Z" }] as any;
      expect(actualTotalMinutes(activities, "2026-07-01", "2026-07-31")).toBe(0);
    });
  });

  describe("actualTotalHours", () => {
    it("converts minutes to hours rounded to 1 decimal", () => {
      expect(actualTotalHours(360)).toBe(6.0);
      expect(actualTotalHours(90)).toBe(1.5);
      expect(actualTotalHours(100)).toBe(1.7);
    });
  });

  describe("meetsSixHourGuideline", () => {
    it("360 minutes or more → true", () => {
      expect(meetsSixHourGuideline(360)).toBe(true);
      expect(meetsSixHourGuideline(500)).toBe(true);
    });
    it("359 minutes or less → false", () => {
      expect(meetsSixHourGuideline(359)).toBe(false);
      expect(meetsSixHourGuideline(0)).toBe(false);
    });
  });

  describe("surveyMeetsGuideline", () => {
    it('"6+ hours" → true', () => {
      expect(surveyMeetsGuideline("6+ hours")).toBe(true);
    });
    it("other bands → false", () => {
      expect(surveyMeetsGuideline("4-5 hours")).toBe(false);
      expect(surveyMeetsGuideline("1-3 hours")).toBe(false);
      expect(surveyMeetsGuideline("0 hours")).toBe(false);
    });
    it("null → false", () => {
      expect(surveyMeetsGuideline(null)).toBe(false);
    });
  });

  describe("alignmentStatus", () => {
    it("both meet guideline → Aligned", () => {
      expect(alignmentStatus("6+ hours", 400)).toBe("Aligned");
    });
    it("both below guideline → Aligned", () => {
      expect(alignmentStatus("1-3 hours", 100)).toBe("Aligned");
    });
    it("reported meets but actual doesn't → Reported higher than recorded", () => {
      expect(alignmentStatus("6+ hours", 200)).toBe("Reported higher than recorded");
    });
    it("actual meets but reported doesn't → Recorded higher than reported", () => {
      expect(alignmentStatus("1-3 hours", 400)).toBe("Recorded higher than reported");
    });
    it("null weekly hours → Insufficient data", () => {
      expect(alignmentStatus(null, 400)).toBe("Insufficient data");
    });
    it("0 actual minutes → Insufficient data", () => {
      expect(alignmentStatus("6+ hours", 0)).toBe("Insufficient data");
    });
  });

  describe("isTopTwoBox", () => {
    it("Very satisfied / Extremely satisfied → true", () => {
      expect(isTopTwoBox("Very satisfied")).toBe(true);
      expect(isTopTwoBox("Extremely satisfied")).toBe(true);
    });
    it("other responses → false", () => {
      expect(isTopTwoBox("Satisfied")).toBe(false);
      expect(isTopTwoBox("Dissatisfied")).toBe(false);
      expect(isTopTwoBox(null)).toBe(false);
    });
  });

  describe("countMultiSelectResponse", () => {
    it("counts respondents who selected a given option", () => {
      const answers = [
        ["Walking", "Running/jogging"],
        ["Walking", "Swimming"],
        ["Running/jogging"],
      ];
      expect(countMultiSelectResponse(answers, "Walking")).toBe(2);
      expect(countMultiSelectResponse(answers, "Swimming")).toBe(1);
      expect(countMultiSelectResponse(answers, "Netball")).toBe(0);
    });
  });

  describe("regionTotal", () => {
    it("sums school totals for a region", () => {
      const schools = [
        { total_minutes: 1000, total_points: 1000, total_students: 50 },
        { total_minutes: 2000, total_points: 2000, total_students: 80 },
      ];
      expect(regionTotal(schools)).toEqual({
        totalMinutes: 3000, totalPoints: 3000, totalStudents: 130,
      });
    });
    it("handles empty array", () => {
      expect(regionTotal([])).toEqual({
        totalMinutes: 0, totalPoints: 0, totalStudents: 0,
      });
    });
  });

  describe("nationalTotal", () => {
    it("sums region totals", () => {
      const regions = [
        { totalMinutes: 5000, totalPoints: 5000, totalStudents: 200 },
        { totalMinutes: 3000, totalPoints: 3000, totalStudents: 130 },
      ];
      expect(nationalTotal(regions)).toEqual({
        totalMinutes: 8000, totalPoints: 8000, totalStudents: 330,
      });
    });
  });

  describe("anonymiseId", () => {
    it("truncates UUID to 8 chars + ellipsis", () => {
      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      expect(anonymiseId(uuid)).toBe("a1b2c3d4...");
    });
  });
});
