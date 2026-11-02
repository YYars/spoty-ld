import { describe, it, expect } from "vitest";
import { analyzeFreshness } from "../freshness.js";
import type { PlaylistedTrack } from "../../spotify/types.js";

const makeTrack = (name: string, releaseDate: string): PlaylistedTrack => ({
  added_at: "2026-02-16T00:00:00Z",
  track: {
    id: `track-${name}`,
    name,
    duration_ms: 200000,
    popularity: 50,
    explicit: false,
    artists: [{ id: "a1", name: "Artist" }],
    album: { id: "al1", name: "Album", release_date: releaseDate, images: [] },
  },
});

describe("analyzeFreshness", () => {
  it("identifies tracks released within 30 days", () => {
    const tracks = [
      makeTrack("New Song", "2026-02-10"), // 6 days old
      makeTrack("Old Song", "2025-06-01"), // ~260 days old
      makeTrack("Recent Song", "2026-01-20"), // 27 days old
    ];
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshCount).toBe(2);
    expect(result.freshReleases.map((r) => r.name)).toContain("New Song");
    expect(result.freshReleases.map((r) => r.name)).toContain("Recent Song");
  });

  it("returns 0 fresh when all tracks are old", () => {
    const tracks = [makeTrack("Old 1", "2025-01-01"), makeTrack("Old 2", "2024-06-15")];
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshCount).toBe(0);
    expect(result.label).toContain("Catalog listener");
  });

  it("labels correctly for high fresh percentage (non day-one majority)", () => {
    const tracks = [
      makeTrack("Fresh 1", "2026-02-05"), // 11 days — early-bird
      makeTrack("Fresh 2", "2026-01-28"), // 19 days — fresh-catch
      makeTrack("Fresh 3", "2026-01-22"), // 25 days — fresh-catch
    ];
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshCount).toBe(3);
    expect(result.percentFresh).toBe(100);
    expect(result.label).toContain("Early adopter");
  });

  it("handles year-only release dates", () => {
    const tracks = [makeTrack("Old Album Track", "2026")];
    const result = analyzeFreshness(tracks, "2026-02-16");
    // 2026-01-01 is 46 days before 2026-02-16, so not fresh
    expect(result.freshCount).toBe(0);
  });

  it("handles empty tracks", () => {
    const result = analyzeFreshness([], "2026-02-16");
    expect(result.freshCount).toBe(0);
    expect(result.percentFresh).toBe(0);
  });

  it("assigns day-one tier for tracks ≤7 days old", () => {
    const tracks = [makeTrack("New Drop", "2026-02-12")]; // 4 days old
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshReleases[0].tier).toBe("day-one");
    expect(result.tierBreakdown.dayOne).toBe(1);
    expect(result.tierBreakdown.earlyBird).toBe(0);
    expect(result.tierBreakdown.freshCatch).toBe(0);
  });

  it("assigns early-bird tier for tracks 8-14 days old", () => {
    const tracks = [makeTrack("Recent Drop", "2026-02-05")]; // 11 days old
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshReleases[0].tier).toBe("early-bird");
    expect(result.tierBreakdown.earlyBird).toBe(1);
  });

  it("assigns fresh-catch tier for tracks 15-30 days old", () => {
    const tracks = [makeTrack("Older Drop", "2026-01-25")]; // 22 days old
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.freshReleases[0].tier).toBe("fresh-catch");
    expect(result.tierBreakdown.freshCatch).toBe(1);
  });

  it("generates day-one label when majority are day-one", () => {
    const tracks = [
      makeTrack("Drop A", "2026-02-14"), // 2 days old — day-one
      makeTrack("Drop B", "2026-02-13"), // 3 days old — day-one
      makeTrack("Drop C", "2026-02-05"), // 11 days old — early-bird
    ];
    const result = analyzeFreshness(tracks, "2026-02-16");
    expect(result.label).toContain("Day-one listener");
  });
});
