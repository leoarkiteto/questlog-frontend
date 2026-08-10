import { describe, expect, it } from "vitest";
import { platformBrand } from "@/lib/platform";

describe("platformBrand", () => {
  it.each([
    ["PlayStation 5", "playstation"],
    ["PS4", "playstation"],
    ["PS Vita", "playstation"],
    ["Xbox Series X|S", "xbox"],
    ["Xbox One", "xbox"],
    ["Nintendo Switch", "nintendo"],
    ["Nintendo Switch 2", "nintendo"],
    ["PC", "steam"],
    ["Steam", "steam"],
    ["Mobile", "other"],
    ["", "other"],
  ])("maps %s -> %s", (platform, expected) => {
    expect(platformBrand(platform)).toBe(expected);
  });
});
