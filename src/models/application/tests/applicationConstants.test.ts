import { describe, it, expect } from "vitest";
import { calculateDistanceFromTime, formatTimeDisplay } from "../constants/applicationConstants";

describe("calculateDistanceFromTime", () => {
  it("calculates correctly for walking (0.0006 km/min)", () => {
    expect(calculateDistanceFromTime("walking", 60)).toBe(0.036);
  });

  it("calculates correctly for running (0.01 km/min)", () => {
    expect(calculateDistanceFromTime("running", 60)).toBe(0.6);
  });

  it("calculates correctly for cycling (0.016 km/min)", () => {
    expect(calculateDistanceFromTime("cycling", 60)).toBeCloseTo(0.96, 3);
  });

  it("falls back to something_else rate (0.006) for unknown activity type", () => {
    expect(calculateDistanceFromTime("unknown_type" as any, 100)).toBe(0.6);
  });

  it("returns 0 for 0 minutes", () => {
    expect(calculateDistanceFromTime("running", 0)).toBe(0);
  });

  it("result has at most 3 decimal places", () => {
    const result = calculateDistanceFromTime("walking", 1);
    const decimalPlaces = result.toString().split(".")[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(3);
  });
});

describe("formatTimeDisplay", () => {
  it('formats 0 minutes as "0min"', () => {
    expect(formatTimeDisplay(0)).toBe("0min");
  });

  it("formats minutes-only (< 60) without hours", () => {
    expect(formatTimeDisplay(45)).toBe("45min");
  });

  it("formats exact hours without minutes", () => {
    expect(formatTimeDisplay(60)).toBe("1h");
    expect(formatTimeDisplay(120)).toBe("2h");
  });

  it("formats hours and minutes together", () => {
    expect(formatTimeDisplay(61)).toBe("1h 1min");
    expect(formatTimeDisplay(90)).toBe("1h 30min");
    expect(formatTimeDisplay(181)).toBe("3h 1min");
  });
});
