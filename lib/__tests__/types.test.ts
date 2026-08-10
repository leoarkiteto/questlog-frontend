import { describe, expect, it } from "vitest";
import { STATUSES, statusInfo } from "@/lib/types";

describe("STATUSES", () => {
  it("covers the five lists, each with a label, hint, and accent", () => {
    expect(STATUSES.map((s) => s.value)).toEqual([
      "wishlist",
      "purchased",
      "playing",
      "played",
      "dropped",
    ]);
    for (const s of STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
      expect(s.accent).toMatch(/^text-/);
    }
  });
});

describe("statusInfo", () => {
  it("returns the matching status metadata", () => {
    expect(statusInfo("played").label).toBe("Played");
    expect(statusInfo("wishlist").label).toBe("Wishlist");
  });

  it("falls back to the first status for unknown values", () => {
    expect(statusInfo("unknown" as never).value).toBe("wishlist");
  });
});
