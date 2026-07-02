import { describe, it, expect } from "vitest";
import { isEmailAllowedResult } from "../utils/isEmailAllowed";

describe("isEmailAllowedResult", () => {
  it("true → allowed", () => expect(isEmailAllowedResult(true)).toBe(true));
  it("false → blocked", () => expect(isEmailAllowedResult(false)).toBe(false));
  it("undefined → blocked (RPC error path — must fail closed)", () =>
    expect(isEmailAllowedResult(undefined)).toBe(false));
  it("null → blocked", () => expect(isEmailAllowedResult(null)).toBe(false));
  it("0 → blocked", () => expect(isEmailAllowedResult(0 as unknown as boolean)).toBe(false));
  it("empty string → blocked", () =>
    expect(isEmailAllowedResult("" as unknown as boolean)).toBe(false));
});
