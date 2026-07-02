import { describe, it, expect } from "vitest";
import {
  DEFAULT_POINTS_PER_HOUR,
  calculateBasePoints,
  calculatePointsWithMultiplier,
  calculateFixedChallengePoints,
} from "../utils/calculatePoints";

describe("calculatePoints", () => {
  it("DEFAULT_POINTS_PER_HOUR is 60 — the 1-point-per-minute invariant", () => {
    expect(DEFAULT_POINTS_PER_HOUR).toBe(60);
  });

  describe("calculateBasePoints", () => {
    it("60 minutes → 60 points", () => expect(calculateBasePoints(60)).toBe(60));
    it("30 minutes → 30 points", () => expect(calculateBasePoints(30)).toBe(30));
    it("90 minutes → 90 points", () => expect(calculateBasePoints(90)).toBe(90));
    it("180 minutes → 180 points (max allowed duration)", () =>
      expect(calculateBasePoints(180)).toBe(180));
    it("1 minute → 1 point", () => expect(calculateBasePoints(1)).toBe(1));
    it("0 minutes → 0 points", () => expect(calculateBasePoints(0)).toBe(0));
    it("45 minutes → 45 points", () => expect(calculateBasePoints(45)).toBe(45));
  });

  describe("calculatePointsWithMultiplier", () => {
    it("multiplier 1.0 — final_points equals base_points", () => {
      const result = calculatePointsWithMultiplier(60, 1.0);
      expect(result.base_points).toBe(60);
      expect(result.final_points).toBe(60);
      expect(result.challenge_points_multiplier).toBe(1.0);
    });

    it("multiplier 2.0 — final_points doubled", () => {
      const result = calculatePointsWithMultiplier(60, 2.0);
      expect(result.final_points).toBe(120);
    });

    it("base_points is NEVER affected by multiplier (house_points_awarded invariant)", () => {
      const result = calculatePointsWithMultiplier(60, 2.0);
      expect(result.base_points).toBe(60);
    });

    it("no multiplier argument defaults to 1.0", () => {
      const result = calculatePointsWithMultiplier(60);
      expect(result.final_points).toBe(60);
      expect(result.challenge_points_multiplier).toBe(1.0);
    });

    it("fractional multiplier rounds correctly", () => {
      const result = calculatePointsWithMultiplier(45, 1.5);
      expect(result.final_points).toBe(Math.round(45 * 1.5));
    });
  });

  describe("calculateFixedChallengePoints", () => {
    it("final_points equals base_points + challenge_points", () => {
      const result = calculateFixedChallengePoints(30, 50);
      expect(result.final_points).toBe(80);
    });

    it("base_points reflects per-minute earnings", () => {
      const result = calculateFixedChallengePoints(30, 50);
      expect(result.base_points).toBe(30);
    });

    it("challenge_points_multiplier is 1.0", () => {
      const result = calculateFixedChallengePoints(30, 50);
      expect(result.challenge_points_multiplier).toBe(1.0);
    });

    it("0 base_points — final_points equals challenge_points only", () => {
      expect(calculateFixedChallengePoints(0, 100).final_points).toBe(100);
    });

    it("0 challenge_points — final_points equals base_points only", () => {
      expect(calculateFixedChallengePoints(60, 0).final_points).toBe(60);
    });
  });
});
