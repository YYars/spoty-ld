import { describe, it, expect } from "vitest";
import { analyzeWeekOverWeekTrends, analyzeArtistLoyalty } from "../trends.js";
import type { ValidatedAnalysis } from "../../schemas/analysis.js";

/**
 * Helper to create a minimal ValidatedAnalysis for testing
 */
const makeAnalysis = (overrides: {
  weekOf: string;
  discoveryScore?: number;
  primaryGenre?: string;
  groupedGenres?: { category: string; count: number; percentage: number }[];
  deepCuts?: { name: string; artist: string; popularity: number }[];
  journey?: { position: number; track: string; artist: string }[];
}): ValidatedAnalysis => ({
  generatedAt: "2026-01-01T00:00:00Z",
  weekOf: overrides.weekOf,
  journey: overrides.journey ?? [{ position: 1, track: "Track 1", artist: "Artist A" }],
  stats: {
    weekOf: overrides.weekOf,
    newTracksCount: 10,
    mostPopular: { name: "Top", artist: "Artist A", popularity: 80 },
    deepCuts: overrides.deepCuts ?? [{ name: "Deep", artist: "Artist B", popularity: 20 }],
    lastWeekGem: null,
    genres: {
      rawGenres: [],
      groupedGenres: overrides.groupedGenres ?? [
        { category: "Hip-Hop", count: 5, percentage: 50 },
        { category: "Jazz", count: 3, percentage: 30 },
      ],
      primaryGenre: overrides.primaryGenre ?? "Hip-Hop",
      isMultiGenre: true,
      diversityScore: 50,
    },
    artistDiversity: {
      uniqueArtists: 8,
      totalArtistAppearances: 10,
      repeatArtists: [],
      artistPopularitySpread: { min: 10, max: 80, average: 45 },
    },
    discoveryScore: {
      score: overrides.discoveryScore ?? 50,
      undergroundPicks: 3,
      mainstreamHits: 2,
      midTier: 5,
      percentUnderground: 30,
    },
  },
  graphics: {
    deepCut: {
      track: { name: "Deep", artist: "B", albumArt: "", popularity: 20, spotifyUrl: "" },
      discoveryStat: "Deep cut",
    },
    whatYouMissed: {
      available: false,
      previousWeekDate: null,
      removedTracks: [],
      message: "No data",
    },
  },
  audioFeaturesAvailable: false,
  audioSource: "none",
});

describe("analyzeWeekOverWeekTrends", () => {
  it("returns null when no historical data", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const result = analyzeWeekOverWeekTrends(currentStats, []);
    expect(result).toBeNull();
  });

  it("calculates discovery score delta", () => {
    const current = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 77 }).stats;
    const previous = makeAnalysis({ weekOf: "2026-02-09", discoveryScore: 55 });
    const result = analyzeWeekOverWeekTrends(current, [previous]);
    expect(result).not.toBeNull();
    expect(result!.discoveryScoreDelta).toBe(22);
    expect(result!.discoveryScoreDirection).toBe("deeper");
  });

  it("detects genre shifts", () => {
    const current = makeAnalysis({
      weekOf: "2026-02-16",
      groupedGenres: [
        { category: "Pop", count: 4, percentage: 40 },
        { category: "Hip-Hop", count: 2, percentage: 20 },
      ],
    }).stats;
    const previous = makeAnalysis({
      weekOf: "2026-02-09",
      groupedGenres: [
        { category: "Hip-Hop", count: 8, percentage: 80 },
        { category: "Pop", count: 1, percentage: 10 },
      ],
    });
    const result = analyzeWeekOverWeekTrends(current, [previous]);
    expect(result).not.toBeNull();
    expect(result!.genreShifts.length).toBeGreaterThan(0);
    const hipHopShift = result!.genreShifts.find((s) => s.category === "Hip-Hop");
    expect(hipHopShift).toBeDefined();
    expect(hipHopShift!.delta).toBe(-60);
  });

  it("detects primary genre change", () => {
    const current = makeAnalysis({ weekOf: "2026-02-16", primaryGenre: "Pop" }).stats;
    const previous = makeAnalysis({ weekOf: "2026-02-09", primaryGenre: "Hip-Hop" });
    const result = analyzeWeekOverWeekTrends(current, [previous]);
    expect(result!.primaryGenreChanged).toBe(true);
    expect(result!.previousPrimaryGenre).toBe("Hip-Hop");
  });

  it("builds deep cut progression", () => {
    const history = [
      makeAnalysis({
        weekOf: "2026-01-19",
        deepCuts: [{ name: "A", artist: "X", popularity: 3 }],
      }),
      makeAnalysis({
        weekOf: "2026-01-26",
        deepCuts: [{ name: "B", artist: "Y", popularity: 2 }],
      }),
    ];
    const current = makeAnalysis({
      weekOf: "2026-02-02",
      deepCuts: [{ name: "C", artist: "Z", popularity: 1 }],
    }).stats;

    const result = analyzeWeekOverWeekTrends(current, history);
    expect(result!.deepCutProgression).toHaveLength(2);
    expect(result!.deepCutProgression[0].popularity).toBe(3);
    expect(result!.deepCutProgression[1].popularity).toBe(2);
  });
});

describe("analyzeArtistLoyalty", () => {
  it("identifies current obsession (3+ tracks this week)", () => {
    const current = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [
      { artist: "Momoko Gill" },
      { artist: "Momoko Gill" },
      { artist: "Momoko Gill" },
      { artist: "Other" },
    ];
    const result = analyzeArtistLoyalty(current, journey, []);
    expect(result.currentObsession).not.toBeNull();
    expect(result.currentObsession!.name).toBe("Momoko Gill");
  });

  it("identifies loyal artists (3+ weeks)", () => {
    const history = [
      makeAnalysis({
        weekOf: "2026-01-19",
        journey: [{ position: 1, track: "T1", artist: "Momoko Gill" }],
      }),
      makeAnalysis({
        weekOf: "2026-01-26",
        journey: [{ position: 1, track: "T2", artist: "Momoko Gill" }],
      }),
    ];
    const current = makeAnalysis({ weekOf: "2026-02-02" }).stats;
    const journey = [{ artist: "Momoko Gill" }, { artist: "Other" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.loyalArtists.some((a) => a.name === "Momoko Gill")).toBe(true);
  });

  it("identifies one-week wonders (1 week, 3+ tracks)", () => {
    const history = [
      makeAnalysis({
        weekOf: "2026-01-19",
        journey: [
          { position: 1, track: "T1", artist: "A$AP Rocky" },
          { position: 2, track: "T2", artist: "A$AP Rocky" },
          { position: 3, track: "T3", artist: "A$AP Rocky" },
        ],
      }),
    ];
    const current = makeAnalysis({ weekOf: "2026-02-02" }).stats;
    const journey = [{ artist: "Other" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.oneWeekWonders.some((a) => a.name === "A$AP Rocky")).toBe(true);
  });

  it("filters out old one-week wonders (>3 weeks ago)", () => {
    const history = [
      makeAnalysis({
        weekOf: "2026-01-05",
        journey: [
          { position: 1, track: "T1", artist: "Old Wonder" },
          { position: 2, track: "T2", artist: "Old Wonder" },
          { position: 3, track: "T3", artist: "Old Wonder" },
        ],
      }),
    ];
    // Current week is 2026-02-16, so cutoff = Jan 26. Jan 5 < Jan 26 → filtered out.
    const current = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [{ artist: "Other" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.oneWeekWonders.some((a) => a.name === "Old Wonder")).toBe(false);
  });

  it("keeps recent one-week wonders (within 3 weeks)", () => {
    const history = [
      makeAnalysis({
        weekOf: "2026-02-09",
        journey: [
          { position: 1, track: "T1", artist: "Recent Wonder" },
          { position: 2, track: "T2", artist: "Recent Wonder" },
          { position: 3, track: "T3", artist: "Recent Wonder" },
        ],
      }),
    ];
    // Current week is 2026-02-16, cutoff = Jan 26. Feb 9 >= Jan 26 → kept.
    const current = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [{ artist: "Other" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.oneWeekWonders.some((a) => a.name === "Recent Wonder")).toBe(true);
  });

  it("does NOT flag consecutive-week artist as comeback", () => {
    // Tigran Hamasyan bug: appeared Feb 9 + Feb 16 (consecutive) → should NOT be comeback
    const history = [
      makeAnalysis({
        weekOf: "2026-02-09",
        journey: [{ position: 1, track: "T1", artist: "Tigran Hamasyan" }],
      }),
    ];
    const current = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [{ artist: "Tigran Hamasyan" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.comebackArtists.some((a) => a.name === "Tigran Hamasyan")).toBe(false);
  });

  it("flags artist with genuine gap as comeback", () => {
    // Appeared Jan 19, absent Jan 26 & Feb 2 & Feb 9, back Feb 16 (28-day gap)
    const history = [
      makeAnalysis({
        weekOf: "2026-01-19",
        journey: [{ position: 1, track: "T1", artist: "Comeback Kid" }],
      }),
    ];
    const current = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [{ artist: "Comeback Kid" }];

    const result = analyzeArtistLoyalty(current, journey, history);
    expect(result.comebackArtists.some((a) => a.name === "Comeback Kid")).toBe(true);
  });
});
