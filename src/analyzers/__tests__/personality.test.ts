import { describe, it, expect } from "vitest";
import { analyzePersonality } from "../personality.js";
import type { ValidatedAnalysis } from "../../schemas/analysis.js";

/**
 * Helper to create a minimal ValidatedAnalysis for personality testing
 */
const makeAnalysis = (overrides: {
  weekOf: string;
  discoveryScore?: number;
  primaryGenre?: string;
  journey?: { position: number; track: string; artist: string }[];
}): ValidatedAnalysis => ({
  generatedAt: "2026-01-01T00:00:00Z",
  weekOf: overrides.weekOf,
  journey: overrides.journey ?? [{ position: 1, track: "Track 1", artist: "Artist A" }],
  stats: {
    weekOf: overrides.weekOf,
    newTracksCount: 10,
    mostPopular: { name: "Top", artist: "Artist A", popularity: 80 },
    deepCuts: [{ name: "Deep", artist: "Artist B", popularity: 20 }],
    lastWeekGem: null,
    genres: {
      rawGenres: [],
      groupedGenres: [{ category: overrides.primaryGenre ?? "Hip-Hop", count: 5, percentage: 50 }],
      primaryGenre: overrides.primaryGenre ?? "Hip-Hop",
      isMultiGenre: false,
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

describe("analyzePersonality", () => {
  it("returns null with fewer than 3 weeks of data", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 60 }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [makeAnalysis({ weekOf: "2026-02-09" })];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result).toBeNull();
  });

  it("returns personality with 3+ weeks of data", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 60 }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 50 }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 55 }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result).not.toBeNull();
    expect(result!.listenerArchetype).toBeDefined();
    expect(result!.summary).toBeDefined();
  });

  it("assigns 'Loyal underground fan' for high discovery + low fluidity", () => {
    const currentStats = makeAnalysis({
      weekOf: "2026-02-16",
      discoveryScore: 75,
      primaryGenre: "Hip-Hop",
    }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 72, primaryGenre: "Hip-Hop" }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 78, primaryGenre: "Hip-Hop" }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.listenerArchetype).toBe("Loyal underground fan");
  });

  it("assigns 'Genre-fluid deep diver' for high discovery + high fluidity", () => {
    const currentStats = makeAnalysis({
      weekOf: "2026-02-16",
      discoveryScore: 75,
      primaryGenre: "Jazz",
    }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 72, primaryGenre: "Hip-Hop" }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 78, primaryGenre: "Electronic" }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.listenerArchetype).toBe("Genre-fluid deep diver");
    expect(result!.genreFluidity).toBe(100); // Every week different genre
  });

  it("assigns 'Eclectic explorer' for mid discovery + high fluidity", () => {
    const currentStats = makeAnalysis({
      weekOf: "2026-02-16",
      discoveryScore: 50,
      primaryGenre: "Jazz",
    }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 45, primaryGenre: "Hip-Hop" }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 55, primaryGenre: "Electronic" }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.listenerArchetype).toBe("Eclectic explorer");
  });

  it("assigns 'Consistent curator' for mid discovery + low fluidity", () => {
    const currentStats = makeAnalysis({
      weekOf: "2026-02-16",
      discoveryScore: 50,
      primaryGenre: "Hip-Hop",
    }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 45, primaryGenre: "Hip-Hop" }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 55, primaryGenre: "Hip-Hop" }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.listenerArchetype).toBe("Consistent curator");
  });

  it("assigns 'Mainstream tastemaker' for low discovery", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 30 }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 25 }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 35 }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.listenerArchetype).toBe("Mainstream tastemaker");
  });

  it("detects signature artists (≥50% of weeks)", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16" }).stats;
    const journey = [{ artist: "Momoko Gill" }, { artist: "Other" }];
    const history = [
      makeAnalysis({
        weekOf: "2026-01-26",
        journey: [
          { position: 1, track: "T1", artist: "Momoko Gill" },
          { position: 2, track: "T2", artist: "Rare Guest" },
        ],
      }),
      makeAnalysis({
        weekOf: "2026-02-02",
        journey: [{ position: 1, track: "T3", artist: "Momoko Gill" }],
      }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    // Momoko Gill: 3/3 weeks = 100% ≥ 50% → signature
    expect(result!.signatureArtists).toContain("Momoko Gill");
    // Rare Guest: 1/3 weeks < 50% → not signature
    expect(result!.signatureArtists).not.toContain("Rare Guest");
  });

  it("calculates genre fluidity correctly", () => {
    const currentStats = makeAnalysis({
      weekOf: "2026-02-16",
      primaryGenre: "Jazz",
    }).stats;
    const journey = [{ artist: "Artist A" }];
    // Hip-Hop → Hip-Hop → Jazz: 1 change out of 2 transitions = 50%
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", primaryGenre: "Hip-Hop" }),
      makeAnalysis({ weekOf: "2026-02-02", primaryGenre: "Hip-Hop" }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.genreFluidity).toBe(50);
  });

  it("detects 'going deeper' discovery trend", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 80 }).stats;
    const journey = [{ artist: "Artist A" }];
    // First half: 40,45 (avg 43) → Second half: 60,80 (avg 70) → delta = +27
    const history = [
      makeAnalysis({ weekOf: "2026-01-19", discoveryScore: 40 }),
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 45 }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 60 }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.discoveryTrend).toBe("going deeper");
  });

  it("detects 'consistent' discovery trend", () => {
    const currentStats = makeAnalysis({ weekOf: "2026-02-16", discoveryScore: 52 }).stats;
    const journey = [{ artist: "Artist A" }];
    const history = [
      makeAnalysis({ weekOf: "2026-01-26", discoveryScore: 50 }),
      makeAnalysis({ weekOf: "2026-02-02", discoveryScore: 51 }),
    ];

    const result = analyzePersonality(currentStats, journey, history);
    expect(result!.discoveryTrend).toBe("consistent");
  });
});
