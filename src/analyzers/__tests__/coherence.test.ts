import { describe, it, expect } from "vitest";
import { calculateCoherence } from "../coherence.js";
import type { WeeklyStats } from "../../spotify/types.js";

const makeStats = (
  groupedGenres: { category: string; count: number; percentage: number }[]
): WeeklyStats =>
  ({
    genres: {
      groupedGenres,
      rawGenres: [],
      primaryGenre: groupedGenres[0]?.category ?? "Mixed",
      isMultiGenre: groupedGenres.length >= 2,
      diversityScore: 50,
    },
  }) as unknown as WeeklyStats;

describe("calculateCoherence", () => {
  it("scores high for focused playlists (one genre, similar popularity)", () => {
    const stats = makeStats([{ category: "Hip-Hop", count: 10, percentage: 94 }]);
    const popularities = [40, 45, 42, 48, 43]; // Low variance
    const result = calculateCoherence(stats, popularities);
    expect(result.score).toBeGreaterThan(60);
    expect(result.label).toMatch(/Focused|Curated/);
  });

  it("scores low for eclectic playlists (many genres, varied popularity)", () => {
    const stats = makeStats([
      { category: "Hip-Hop", count: 2, percentage: 20 },
      { category: "Jazz", count: 2, percentage: 20 },
      { category: "Rock", count: 2, percentage: 20 },
      { category: "Pop", count: 2, percentage: 20 },
      { category: "Electronic", count: 2, percentage: 20 },
    ]);
    const popularities = [1, 20, 50, 70, 90]; // High variance
    const result = calculateCoherence(stats, popularities);
    expect(result.score).toBeLessThan(40);
    expect(result.label).toMatch(/Eclectic|Balanced/);
  });

  it("returns genre concentration percentage", () => {
    const stats = makeStats([
      { category: "Pop", count: 7, percentage: 70 },
      { category: "Rock", count: 3, percentage: 30 },
    ]);
    const result = calculateCoherence(stats, [50, 55, 60]);
    expect(result.genreConcentration).toBe(70);
  });
});
