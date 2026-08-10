export type PlatformBrand = "playstation" | "xbox" | "nintendo" | "steam" | "other";

/**
 * Maps a free-text platform (e.g. "PlayStation 5", "PC", "Nintendo Switch",
 * "Xbox Series X|S") to one of the four supported brands.
 */
export function platformBrand(platform: string): PlatformBrand {
  const p = platform.toLowerCase();
  if (/playstation|ps\d|psp|ps vita|psvita|psx/.test(p) || p === "ps" || p.startsWith("ps ")) {
    return "playstation";
  }
  if (p.includes("xbox")) return "xbox";
  if (/\b(nintendo|switch|wii|3ds|2ds|dsi|gamecube|game boy|gameboy|nes|snes|n64)\b/.test(p)) {
    return "nintendo";
  }
  if (/\b(pc|steam|windows|win|mac|macos|linux)\b/.test(p)) return "steam";
  return "other";
}
