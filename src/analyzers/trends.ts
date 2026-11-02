/**
 * Week-over-week trend analysis and artist loyalty tracking
 * Pure functions that analyze historical data for Instagram-worthy insights
 */

import type {
  WeekOverWeekTrend,
  GenreShift,
  DeepCutTrend,
  ArtistLoyalty,
  ArtistLoyaltyEntry,
  ArtistAppearance,
} from "../spotify/types.js";
import type { ValidatedAnalysis } from "../schemas/analysis.js";

/**
 * Minimal stats interface for trend analysis (works with both WeeklyStats and ValidatedAnalysis.stats)
 */
interface TrendableStats {
  readonly weekOf: string;
  readonly discoveryScore: { readonly score: number };
  readonly genres: {
    readonly primaryGenre: string;
    readonly groupedGenres: readonly { readonly category: string; readonly percentage: number }[];
  };
  readonly deepCuts: readonly { readonly name: string; readonly popularity: number }[];
}

// =============================================================================
// Week-over-Week Trends
// =============================================================================

/**
 * Determine discovery score direction label
 */
const getDiscoveryDirection = (delta: number): "deeper" | "surfacing" | "steady" => {
  if (delta >= 5) {
    return "deeper";
  }
  if (delta <= -5) {
    return "surfacing";
  }
  return "steady";
};

/**
 * Calculate genre shifts between two weeks
 */
const calculateGenreShifts = (
  currentGenres: readonly { readonly category: string; readonly percentage: number }[],
  previousGenres: readonly { readonly category: string; readonly percentage: number }[]
): readonly GenreShift[] => {
  const previousMap = new Map(previousGenres.map((g) => [g.category, g.percentage]));
  const currentMap = new Map(currentGenres.map((g) => [g.category, g.percentage]));

  // Combine all categories from both weeks
  const allCategories = new Set([...previousMap.keys(), ...currentMap.keys()]);

  return [...allCategories]
    .map((category) => {
      const previousPct = previousMap.get(category) ?? 0;
      const currentPct = currentMap.get(category) ?? 0;
      return { category, previousPct, currentPct, delta: currentPct - previousPct };
    })
    .filter((shift) => Math.abs(shift.delta) >= 5) // Only significant shifts
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
};

/**
 * Build deep cut progression across all historical weeks
 */
const buildDeepCutProgression = (
  allAnalyses: readonly ValidatedAnalysis[]
): readonly DeepCutTrend[] =>
  allAnalyses
    .filter((a) => a.stats.deepCuts.length > 0)
    .map((a) => ({
      weekOf: a.weekOf,
      trackName: a.stats.deepCuts[0].name,
      popularity: a.stats.deepCuts[0].popularity,
    }));

/**
 * A candidate insight with a vividness score for ranking
 */
interface InsightCandidate {
  readonly text: string;
  readonly vividness: number;
}

/**
 * Collect all candidate insights with vividness scores
 */
const collectInsightCandidates = (
  currentStats: TrendableStats,
  previousStats: TrendableStats,
  allAnalyses: readonly ValidatedAnalysis[],
  genreShifts: readonly GenreShift[],
  currentObsessionName: string | null
): readonly InsightCandidate[] => {
  const candidates: InsightCandidate[] = [];
  const discoveryDelta = currentStats.discoveryScore.score - previousStats.discoveryScore.score;

  // Genre surge/drop ≥20%
  for (const shift of genreShifts) {
    if (Math.abs(shift.delta) >= 20) {
      const text =
        shift.delta > 0
          ? `${shift.category} surged from ${shift.previousPct}% to ${shift.currentPct}% this week`
          : `${shift.category} dropped from ${shift.previousPct}% to ${shift.currentPct}%`;
      candidates.push({ text, vividness: Math.abs(shift.delta) });
    }
  }

  // 3-week discovery climb
  if (allAnalyses.length >= 3) {
    const recentScores = allAnalyses.slice(-3).map((a) => a.stats.discoveryScore.score);
    const allIncreasing = recentScores[0] < recentScores[1] && recentScores[1] < recentScores[2];
    if (allIncreasing) {
      candidates.push({
        text: `Discovery score climbing for 3 weeks straight: ${recentScores.join(" → ")}`,
        vividness: 30,
      });
    }
  }

  // Primary genre change
  if (currentStats.genres.primaryGenre !== previousStats.genres.primaryGenre) {
    candidates.push({
      text: `New primary genre: ${currentStats.genres.primaryGenre} (was ${previousStats.genres.primaryGenre})`,
      vividness: 25,
    });
  }

  // Discovery delta ≥10
  if (Math.abs(discoveryDelta) >= 10) {
    const direction = discoveryDelta > 0 ? "deeper underground" : "toward mainstream";
    candidates.push({
      text: `Going ${direction} (${discoveryDelta > 0 ? "+" : ""}${discoveryDelta} discovery score)`,
      vividness: Math.abs(discoveryDelta) + 10,
    });
  }

  // Current obsession
  if (currentObsessionName) {
    candidates.push({
      text: `Current obsession: ${currentObsessionName}`,
      vividness: 15,
    });
  }

  return candidates;
};

/**
 * Generate top Instagram-ready insight strings (up to 3)
 * Falls back to discovery score movement or steady state
 */
const generateInsights = (
  currentStats: TrendableStats,
  previousStats: TrendableStats,
  allAnalyses: readonly ValidatedAnalysis[],
  genreShifts: readonly GenreShift[],
  currentObsessionName: string | null = null
): readonly string[] => {
  const candidates = collectInsightCandidates(
    currentStats,
    previousStats,
    allAnalyses,
    genreShifts,
    currentObsessionName
  );

  // Sort by vividness descending, take top 3
  const top = [...candidates].sort((a, b) => b.vividness - a.vividness).slice(0, 3);

  if (top.length > 0) {
    return top.map((c) => c.text);
  }

  // Fallback: smaller discovery movement or steady state
  const discoveryDelta = currentStats.discoveryScore.score - previousStats.discoveryScore.score;
  if (Math.abs(discoveryDelta) >= 5) {
    const direction = discoveryDelta > 0 ? "deeper underground" : "toward mainstream";
    return [
      `Going ${direction} (${discoveryDelta > 0 ? "+" : ""}${discoveryDelta} discovery score)`,
    ];
  }

  return [`Holding steady at ${currentStats.discoveryScore.score} discovery score`];
};

/**
 * Analyze week-over-week trends
 * Compares current week against previous week and all historical data
 */
export const analyzeWeekOverWeekTrends = (
  currentStats: TrendableStats,
  allAnalyses: readonly ValidatedAnalysis[]
): WeekOverWeekTrend | null => {
  if (allAnalyses.length === 0) {
    return null;
  }

  const previousAnalysis = allAnalyses[allAnalyses.length - 1];
  const previousStats = previousAnalysis.stats;

  const discoveryScoreDelta =
    currentStats.discoveryScore.score - previousStats.discoveryScore.score;

  const genreShifts = calculateGenreShifts(
    currentStats.genres.groupedGenres,
    previousStats.genres.groupedGenres
  );

  const deepCutProgression = buildDeepCutProgression(allAnalyses);

  const insights = generateInsights(currentStats, previousStats, allAnalyses, genreShifts);

  return {
    previousWeek: previousAnalysis.weekOf,
    discoveryScoreDelta,
    discoveryScoreDirection: getDiscoveryDirection(discoveryScoreDelta),
    genreShifts: [...genreShifts],
    primaryGenreChanged: currentStats.genres.primaryGenre !== previousStats.genres.primaryGenre,
    previousPrimaryGenre: previousStats.genres.primaryGenre,
    deepCutProgression: [...deepCutProgression],
    insight: insights[0],
    insights: [...insights],
  };
};

// =============================================================================
// Artist Loyalty Tracking
// =============================================================================

/**
 * Extract artist names and track counts from a single analysis
 */
const extractArtistCounts = (analysis: ValidatedAnalysis): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const journeyTrack of analysis.journey) {
    // Split comma-separated artists
    const artists = journeyTrack.artist.split(", ");
    for (const artist of artists) {
      counts.set(artist, (counts.get(artist) ?? 0) + 1);
    }
  }
  return counts;
};

/**
 * Build artist appearance history across all weeks
 */
const buildArtistHistory = (
  allAnalyses: readonly ValidatedAnalysis[]
): ReadonlyMap<string, readonly ArtistAppearance[]> => {
  const history = new Map<string, ArtistAppearance[]>();

  for (const analysis of allAnalyses) {
    const counts = extractArtistCounts(analysis);
    for (const [artist, trackCount] of counts.entries()) {
      const existing = history.get(artist) ?? [];
      history.set(artist, [...existing, { weekOf: analysis.weekOf, trackCount }]);
    }
  }

  return history;
};

/**
 * Categorize an artist based on their appearance pattern
 */
const categorizeArtist = (
  appearances: readonly ArtistAppearance[],
  totalWeeks: number,
  currentWeekAppearances: readonly ArtistAppearance[]
): ArtistLoyaltyEntry["category"] => {
  const currentTrackCount =
    currentWeekAppearances.length > 0 ? currentWeekAppearances[0].trackCount : 0;

  // Current obsession: 3+ tracks this week
  if (currentTrackCount >= 3) {
    return "current-obsession";
  }

  // One-week wonder: appeared only once with 3+ tracks
  if (appearances.length === 1 && appearances[0].trackCount >= 3) {
    return "one-week-wonder";
  }

  // Loyal: appeared in 3+ weeks
  if (appearances.length >= 3) {
    return "loyal";
  }

  // Comeback: appeared, had a genuine gap (>10 days), then returned
  if (appearances.length >= 2 && currentTrackCount > 0) {
    const sorted = [...appearances].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
    const lastDate = new Date(sorted[sorted.length - 1].weekOf);
    const prevDate = new Date(sorted[sorted.length - 2].weekOf);
    const gapDays = (lastDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    // More than 10 days between last two appearances = skipped at least 1 week
    if (gapDays > 10) {
      return "comeback";
    }
  }

  return "regular";
};

/**
 * Generate a narrative string for an artist
 */
const generateNarrative = (
  name: string,
  appearances: readonly ArtistAppearance[],
  totalWeeks: number,
  category: ArtistLoyaltyEntry["category"]
): string => {
  const totalTracks = appearances.reduce((sum, a) => sum + a.trackCount, 0);

  switch (category) {
    case "current-obsession": {
      const latest = appearances[appearances.length - 1];
      return `${latest.trackCount} tracks this week — current obsession`;
    }
    case "one-week-wonder":
      return `${appearances[0].trackCount} tracks in one week, then gone`;
    case "loyal":
      return `${appearances.length} of ${totalWeeks} weeks, ${totalTracks} total tracks`;
    case "comeback": {
      const latest = appearances[appearances.length - 1];
      return `Back with ${latest.trackCount} track${latest.trackCount > 1 ? "s" : ""} after absence`;
    }
    default:
      return `${appearances.length} week${appearances.length > 1 ? "s" : ""}, ${totalTracks} track${totalTracks > 1 ? "s" : ""}`;
  }
};

/**
 * Analyze artist loyalty across all historical weeks + current week
 */
export const analyzeArtistLoyalty = (
  currentStats: TrendableStats,
  currentJourney: readonly { readonly artist: string }[],
  allAnalyses: readonly ValidatedAnalysis[]
): ArtistLoyalty => {
  // Build current week data as a pseudo-analysis for the history
  const currentArtistCounts = new Map<string, number>();
  for (const track of currentJourney) {
    const artists = track.artist.split(", ");
    for (const artist of artists) {
      currentArtistCounts.set(artist, (currentArtistCounts.get(artist) ?? 0) + 1);
    }
  }

  const artistHistory = buildArtistHistory(allAnalyses);
  const totalWeeks = allAnalyses.length + 1; // +1 for current week

  // Merge current week into history
  const fullHistory = new Map(artistHistory);
  for (const [artist, count] of currentArtistCounts.entries()) {
    const existing = fullHistory.get(artist) ?? [];
    fullHistory.set(artist, [...existing, { weekOf: currentStats.weekOf, trackCount: count }]);
  }

  // Categorize all artists
  const entries: ArtistLoyaltyEntry[] = [];
  for (const [name, appearances] of fullHistory.entries()) {
    const currentWeekApps = appearances.filter((a) => a.weekOf === currentStats.weekOf);
    const category = categorizeArtist(appearances, totalWeeks, currentWeekApps);
    const totalTracks = appearances.reduce((sum, a) => sum + a.trackCount, 0);

    entries.push({
      name,
      weeksAppeared: appearances.length,
      totalWeeksTracked: totalWeeks,
      totalTracks,
      appearances: [...appearances],
      category,
      narrative: generateNarrative(name, appearances, totalWeeks, category),
    });
  }

  // Sort entries: most appearances first, then most tracks
  const sorted = entries.sort(
    (a, b) => b.weeksAppeared - a.weeksAppeared || b.totalTracks - a.totalTracks
  );

  // Only show one-week wonders from the last 3 weeks (old ones are noise)
  const recentCutoff = new Date(currentStats.weekOf);
  recentCutoff.setDate(recentCutoff.getDate() - 21);

  return {
    loyalArtists: sorted.filter((e) => e.category === "loyal"),
    oneWeekWonders: sorted.filter(
      (e) => e.category === "one-week-wonder" && new Date(e.appearances[0].weekOf) >= recentCutoff
    ),
    currentObsession: sorted.find((e) => e.category === "current-obsession") ?? null,
    comebackArtists: sorted.filter((e) => e.category === "comeback"),
  };
};
