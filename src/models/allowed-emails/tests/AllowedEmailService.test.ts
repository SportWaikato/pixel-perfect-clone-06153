import { describe, it, expect, beforeEach } from "vitest";
import { AllowedEmailService } from "../services/AllowedEmailService";
import { makeSupabaseMock } from "@/models/__tests__/utils/supabaseMock";

const SCHOOL_ID = "school-1";
const USER_ID = "user-1";

const makeEntry = (email: string, id = "1") => ({
  id,
  school_id: SCHOOL_ID,
  email,
  note: null,
  created_at: "2024-01-01T00:00:00Z",
  created_by: USER_ID,
  user_id: null,
});

describe("AllowedEmailService", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: AllowedEmailService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new AllowedEmailService(supabase as any);
  });

  describe("getBySchoolId", () => {
    it("returns emails for the school", async () => {
      const emails = [makeEntry("a@school.com", "1"), makeEntry("b@school.com", "2")];
      supabase._chain.order.mockResolvedValue({ data: emails, error: null });

      const result = await service.getBySchoolId(SCHOOL_ID);

      expect(result).toEqual(emails);
      expect(supabase.from).toHaveBeenCalledWith("allowed_emails");
      expect(supabase._chain.eq).toHaveBeenCalledWith("school_id", SCHOOL_ID);
    });

    it("returns empty array when no emails exist", async () => {
      supabase._chain.order.mockResolvedValue({ data: null, error: null });
      expect(await service.getBySchoolId(SCHOOL_ID)).toEqual([]);
    });

    it("throws on database error", async () => {
      supabase._chain.order.mockResolvedValue({ data: null, error: { message: "DB error" } });
      await expect(service.getBySchoolId(SCHOOL_ID)).rejects.toThrow("DB error");
    });
  });

  describe("bulkAdd", () => {
    it("normalises emails to lowercase and trims whitespace", async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ["  STUDENT@School.COM  ", "Other@school.com"], USER_ID);

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "student@school.com" }),
          expect.objectContaining({ email: "other@school.com" }),
        ]),
      );
    });

    it("deduplicates emails within the input", async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ["a@school.com", "A@school.com", "a@school.com"], USER_ID);

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows).toHaveLength(1);
    });

    it("correctly separates added from skipped (already-existing) emails", async () => {
      const added = [makeEntry("new@school.com", "2")];
      supabase._chain.select.mockResolvedValue({ data: added, error: null });

      const result = await service.bulkAdd(
        SCHOOL_ID,
        ["new@school.com", "existing@school.com"],
        USER_ID,
      );

      expect(result.added).toEqual(added);
      expect(result.skipped).toEqual(["existing@school.com"]);
    });

    it("returns all as added when all emails are new", async () => {
      const added = [makeEntry("a@school.com", "1"), makeEntry("b@school.com", "2")];
      supabase._chain.select.mockResolvedValue({ data: added, error: null });

      const result = await service.bulkAdd(SCHOOL_ID, ["a@school.com", "b@school.com"], USER_ID);

      expect(result.added).toEqual(added);
      expect(result.skipped).toEqual([]);
    });

    it("attaches optional note to each row", async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ["a@school.com"], USER_ID, "batch import");

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows[0].note).toBe("batch import");
    });

    it("throws on database error", async () => {
      supabase._chain.select.mockResolvedValue({ data: null, error: { message: "insert failed" } });
      await expect(service.bulkAdd(SCHOOL_ID, ["a@school.com"], USER_ID)).rejects.toThrow(
        "insert failed",
      );
    });
  });

  describe("remove", () => {
    it("deletes the entry by id", async () => {
      supabase._chain.eq.mockResolvedValue({ data: null, error: null });

      await service.remove("entry-1");

      expect(supabase._chain.delete).toHaveBeenCalled();
      expect(supabase._chain.eq).toHaveBeenCalledWith("id", "entry-1");
    });

    it("throws on database error", async () => {
      supabase._chain.eq.mockResolvedValue({ data: null, error: { message: "delete failed" } });
      await expect(service.remove("entry-1")).rejects.toThrow("delete failed");
    });
  });

  describe("isAllowed (allow list mode)", () => {
    it("returns true when RPC confirms email is on the allow list", async () => {
      supabase.rpc.mockResolvedValue({ data: true, error: null });

      const result = await service.isAllowed(SCHOOL_ID, "student@school.com");

      expect(result).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith("is_email_allowed", {
        p_school_id: SCHOOL_ID,
        p_email: "student@school.com",
      });
    });

    it("returns false when email is not on the allow list", async () => {
      supabase.rpc.mockResolvedValue({ data: false, error: null });
      expect(await service.isAllowed(SCHOOL_ID, "unlisted@school.com")).toBe(false);
    });

    it("returns false on RPC error (fail-closed)", async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });
      expect(await service.isAllowed(SCHOOL_ID, "anyone@school.com")).toBe(false);
    });

    it("returns false when RPC returns null (fail-closed)", async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: null });
      expect(await service.isAllowed(SCHOOL_ID, "anyone@school.com")).toBe(false);
    });
  });
});
