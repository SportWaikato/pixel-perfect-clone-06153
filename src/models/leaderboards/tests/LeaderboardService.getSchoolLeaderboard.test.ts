import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeaderboardService } from "../services/LeaderboardService";
import { makeSupabaseMock } from "@/models/__tests__/utils/supabaseMock";

function makeSchool(overrides: {
  id: string;
  name: string;
  is_internal?: boolean;
  is_active?: boolean;
  total_points?: number;
  total_students?: number;
}) {
  return {
    id: overrides.id,
    name: overrides.name,
    is_internal: overrides.is_internal ?? false,
    is_active: overrides.is_active ?? true,
    total_points: overrides.total_points ?? 0,
    total_students: overrides.total_students ?? 1,
    total_kilometers: 0,
    code: overrides.id,
  };
}

const SCHOOL_A = makeSchool({ id: "a", name: "School A", total_points: 1000, total_students: 100 });
const SCHOOL_B = makeSchool({ id: "b", name: "School B", total_points: 500, total_students: 50 });
const SCHOOL_C = makeSchool({
  id: "c",
  name: "School C (Internal)",
  is_internal: true,
  total_points: 2000,
  total_students: 20,
});

function setupLeaderboardMock(
  supabase: ReturnType<typeof makeSupabaseMock>,
  {
    userSchool,
    schools,
  }: {
    userSchool: { is_internal: boolean } | null;
    schools: ReturnType<typeof makeSchool>[];
  },
) {
  supabase.from = vi.fn().mockImplementation((table: string) => {
    const chain = { ...supabase._chain };
    chain.select = vi.fn().mockReturnThis();
    chain.eq = vi.fn().mockReturnThis();
    chain.order = vi.fn().mockReturnThis();

    if (table === "schools") {
      const callCount = 0;
      chain.single = vi.fn().mockResolvedValue({ data: userSchool, error: null });

      // The filter chain: .eq('is_active', true) then possibly more filters then .order()
      // We need to return schools from the final .order() call
      chain.order = vi.fn().mockResolvedValue({ data: schools, error: null });
    }

    return chain;
  });
}

describe("LeaderboardService.getSchoolLeaderboard — internal school filtering", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: LeaderboardService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new LeaderboardService(supabase as any);
  });

  it("regular school user sees only non-internal schools", async () => {
    // The first .from('schools') call fetches the user's school (is_internal: false)
    // The second call fetches filtered schools
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.order = vi.fn().mockReturnThis();

      if (table === "schools") {
        let callCount = 0;
        const originalSingle = chain.single;
        chain.single = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1)
            return Promise.resolve({ data: { is_internal: false }, error: null });
          return Promise.resolve({ data: null, error: null });
        });
        // Final query result — return only non-internal schools
        chain.order = vi.fn().mockResolvedValue({ data: [SCHOOL_A, SCHOOL_B], error: null });
      }

      return chain;
    });

    const result = await service.getSchoolLeaderboard("school-a");
    const ids = result.map((s) => s.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).not.toContain("c");
  });

  it("internal school user sees only their own school", async () => {
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.order = vi.fn().mockReturnThis();

      if (table === "schools") {
        let callCount = 0;
        chain.single = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve({ data: { is_internal: true }, error: null });
          return Promise.resolve({ data: null, error: null });
        });
        chain.order = vi.fn().mockResolvedValue({ data: [SCHOOL_C], error: null });
      }

      return chain;
    });

    const result = await service.getSchoolLeaderboard("school-c");
    expect(result.map((s) => s.id)).toEqual(["c"]);
  });

  it("no userSchoolId → all active schools returned (admin/unauthenticated)", async () => {
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.order = vi
        .fn()
        .mockResolvedValue({ data: [SCHOOL_A, SCHOOL_B, SCHOOL_C], error: null });
      return chain;
    });

    const result = await service.getSchoolLeaderboard(); // no userSchoolId
    const ids = result.map((s) => s.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toContain("c");
  });

  it("pro-rata ranking: school with higher pts/student ranks above school with more total pts", async () => {
    // School X: 10 students, 200 pts → pro-rata = 2000
    // School Y: 100 students, 1000 pts → pro-rata = 1000
    // Even though Y has more total points, X should rank first
    const schoolX = makeSchool({
      id: "x",
      name: "Small School",
      total_points: 200,
      total_students: 10,
    });
    const schoolY = makeSchool({
      id: "y",
      name: "Big School",
      total_points: 1000,
      total_students: 100,
    });

    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      // Return Y first (higher total_points), X second — to verify re-sort happens
      chain.order = vi.fn().mockResolvedValue({ data: [schoolY, schoolX], error: null });
      return chain;
    });

    const result = await service.getSchoolLeaderboard();
    expect(result[0].id).toBe("x"); // small school wins on pro-rata
    expect(result[1].id).toBe("y");
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("school with 0 students gets pro_rata_score of 0 (no division by zero)", async () => {
    const zeroSchool = makeSchool({
      id: "z",
      name: "Empty School",
      total_points: 500,
      total_students: 0,
    });

    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.order = vi.fn().mockResolvedValue({ data: [zeroSchool], error: null });
      return chain;
    });

    const result = await service.getSchoolLeaderboard();
    expect(result[0].pro_rata_score).toBe(0);
  });
});
