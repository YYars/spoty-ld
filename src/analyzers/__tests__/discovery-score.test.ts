import { describe, it, expect } from "vitest";
import { calculateDiscoveryScore } from "../discovery-score.js";
import type { PlaylistedTrack } from "../../spotify/types.js";

const makeTrack = (popularity: number): PlaylistedTrack => ({
  added_at: "2026-02-16T00:00:00Z",
  track: {
    id: `track-${popularity}`,
    name: `Track ${popularity}`,
    duration_ms: 200000,
    popularity,
    explicit: false,
    artists: [{ id: "a1", name: "Artist" }],
    album: { id: "al1", name: "Album", release_date: "2026-01-01", images: [] },
  },
});

describe("calculateDiscoveryScore", () => {
  it("returns 100 for all underground tracks (popularity < 20)", () => {
    const tracks = [makeTrack(5), makeTrack(10), makeTrack(15)];
    const result = calculateDiscoveryScore(tracks);
    expect(result.score).toBe(100);
    expect(result.undergroundPicks).toBe(3);
    expect(result.mainstreamHits).toBe(0);
    expect(result.percentUnderground).toBe(100);
  });

  it("returns 0 for all mainstream tracks (popularity >= 60)", () => {
    const tracks = [makeTrack(60), makeTrack(80), makeTrack(90)];
    const result = calculateDiscoveryScore(tracks);
    expect(result.score).toBe(0);
    expect(result.mainstreamHits).toBe(3);
    expect(result.undergroundPicks).toBe(0);
  });

  it("returns 50 for all mid-tier tracks (20-59)", () => {
    const tracks = [makeTrack(45), makeTrack(50), makeTrack(55)];
    const result = calculateDiscoveryScore(tracks);
    expect(result.score).toBe(50);
    expect(result.midTier).toBe(3);
  });

  it("calculates weighted score for mixed playlist", () => {
    // 1 underground (100pts) + 1 midTier (50pts) + 1 mainstream (0pts) = 150/3 = 50
    const tracks = [makeTrack(10), makeTrack(50), makeTrack(80)];
    const result = calculateDiscoveryScore(tracks);
    expect(result.score).toBe(50);
    expect(result.undergroundPicks).toBe(1);
    expect(result.midTier).toBe(1);
    expect(result.mainstreamHits).toBe(1);
    expect(result.percentUnderground).toBe(33);
  });

  it("handles empty tracks", () => {
    const result = calculateDiscoveryScore([]);
    expect(result.score).toBe(0);
    expect(result.percentUnderground).toBe(0);
  });
});
