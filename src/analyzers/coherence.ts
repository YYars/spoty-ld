/**
 * Playlist coherence score - how focused vs eclectic is the week's selection
 * Uses genre diversity and popularity spread (no audio features needed)
 * Pure functions - no side effects
 */

import type { WeeklyStats, PlaylistCoherence } from "../spotify/types.js";

/**
 * Calculate standard deviation of an array of numbers
 */
const standardDeviation = (nums: readonly number[]): number => {
  if (nums.length <= 1) {
    return 0;
  }
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const squaredDiffs = nums.map((n) => (n - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / nums.length);
};

/**
 * Generate a coherence label based on the score
 */
const generateCoherenceLabel = (score: number): string => {
  if (score >= 75) {
    return "Focused deep dive";
  }
  if (score >= 50) {
    return "Curated with a theme";
  }
  if (score >= 25) {
    return "Balanced mix";
  }
  return "Eclectic exploration";
};

/**
 * Calculate playlist coherence from existing stats
 * Score 0-100 where 100 = very focused, 0 = very eclectic
 *
 * Factors:
 * - Genre concentration: how dominant is the top genre (0-100)
 * - Popularity variance: how spread out are the popularity values (inverted, 0-100)
 * - Genre count: fewer genres = more focused
 */
export const calculateCoherence = (
  stats: WeeklyStats,
  trackPopularities: readonly number[]
): PlaylistCoherence => {
  // Factor 1: Genre concentration (top genre %)
  const topGenrePct = stats.genres.groupedGenres[0]?.percentage ?? 0;
  // Normalize: 100% = fully concentrated, 0% with many genres = very diverse
  const genreConcentration = topGenrePct;

  // Factor 2: Popularity variance (lower = more coherent)
  const popStdDev = standardDeviation(trackPopularities);
  // Normalize: max plausible std dev is ~50 (0-100 range)
  // Lower std dev = higher coherence
  const popularityCoherence = Math.max(0, 100 - popStdDev * 2);

  // Factor 3: Genre count (fewer = more focused)
  const genreCount = stats.genres.groupedGenres.length;
  const genreCountScore = genreCount <= 1 ? 100 : Math.max(0, 100 - (genreCount - 1) * 15);

  // Weighted average
  const score = Math.round(
    genreConcentration * 0.4 + popularityCoherence * 0.3 + genreCountScore * 0.3
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    label: generateCoherenceLabel(score),
    genreConcentration: topGenrePct,
    popularityVariance: Math.round(popStdDev * 10) / 10,
  };
};
