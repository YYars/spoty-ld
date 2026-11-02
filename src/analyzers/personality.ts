/**
 * Playlist Personality Profile - aggregate listener DNA across all weeks
 * Pure functions - no side effects
 */

import type { PlaylistPersonality } from "../spotify/types.js";
import type { ValidatedAnalysis } from "../schemas/analysis.js";

const MIN_WEEKS_FOR_PERSONALITY = 3;

/**
 * Minimal stats interface for personality analysis
 */
interface PersonalityStats {
  readonly weekOf: string;
  readonly discoveryScore: { readonly score: number };
  readonly genres: {
    readonly primaryGenre: string;
    readonly groupedGenres: readonly { readonly category: string; readonly percentage: number }[];
  };
}

/**
 * Calculate the average of a numeric array
 */
const average = (values: readonly number[]): number =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

/**
 * Determine discovery trend by comparing first half vs second half averages
 */
const calculateDiscoveryTrend = (
  scores: readonly number[]
): "going deeper" | "going mainstream" | "consistent" => {
  if (scores.length < 2) {
    return "consistent";
  }

  const mid = Math.floor(scores.length / 2);
  const firstHalf = average(scores.slice(0, mid));
  const secondHalf = average(scores.slice(mid));
  const delta = secondHalf - firstHalf;

  if (delta >= 5) {
    return "going deeper";
  }
  if (delta <= -5) {
    return "going mainstream";
  }
  return "consistent";
};

/**
 * Find the most frequently occurring primary genre
 */
const findDominantGenre = (genres: readonly string[]): string => {
  const counts = new Map<string, number>();
  for (const genre of genres) {
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }

  let best = "Mixed";
  let bestCount = 0;
  for (const [genre, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      best = genre;
    }
  }
  return best;
};

/**
 * Calculate genre fluidity: how often the primary genre changes between weeks
 * Returns 0-100 where 100 = every week is a different primary genre
 */
const calculateGenreFluidity = (genres: readonly string[]): number => {
  if (genres.length <= 1) {
    return 0;
  }

  let changes = 0;
  for (let i = 1; i < genres.length; i++) {
    if (genres[i] !== genres[i - 1]) {
      changes++;
    }
  }

  return Math.round((changes / (genres.length - 1)) * 100);
};

/**
 * Calculate average rotation rate: % of artists that are new each week
 */
const calculateRotationRate = (allAnalyses: readonly ValidatedAnalysis[]): number => {
  if (allAnalyses.length < 2) {
    return 0;
  }

  const rates: number[] = [];
  for (let i = 1; i < allAnalyses.length; i++) {
    const prevArtists = new Set(allAnalyses[i - 1].journey.map((t) => t.artist));
    const currArtists = allAnalyses[i].journey.map((t) => t.artist);
    const newArtists = currArtists.filter((a) => !prevArtists.has(a));
    rates.push(currArtists.length > 0 ? (newArtists.length / currArtists.length) * 100 : 0);
  }

  return Math.round(average(rates));
};

/**
 * Find signature artists: those appearing in ≥50% of all weeks
 */
const findSignatureArtists = (
  allAnalyses: readonly ValidatedAnalysis[],
  currentJourney: readonly { readonly artist: string }[]
): readonly string[] => {
  const totalWeeks = allAnalyses.length + 1; // +1 for current week
  const threshold = totalWeeks / 2;

  const artistWeeks = new Map<string, number>();

  // Count historical weeks
  for (const analysis of allAnalyses) {
    const weekArtists = new Set(analysis.journey.map((t) => t.artist));
    for (const artist of weekArtists) {
      artistWeeks.set(artist, (artistWeeks.get(artist) ?? 0) + 1);
    }
  }

  // Count current week
  const currentArtists = new Set(currentJourney.map((t) => t.artist));
  for (const artist of currentArtists) {
    artistWeeks.set(artist, (artistWeeks.get(artist) ?? 0) + 1);
  }

  return [...artistWeeks.entries()]
    .filter(([_, weeks]) => weeks >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
};

/**
 * Determine the listener archetype based on discovery score and genre fluidity
 */
const determineArchetype = (discoveryScore: number, genreFluidity: number): string => {
  if (discoveryScore >= 70 && genreFluidity >= 50) {
    return "Genre-fluid deep diver";
  }
  if (discoveryScore >= 70) {
    return "Loyal underground fan";
  }
  if (discoveryScore >= 40 && genreFluidity >= 50) {
    return "Eclectic explorer";
  }
  if (discoveryScore >= 40) {
    return "Consistent curator";
  }
  return "Mainstream tastemaker";
};

/**
 * Generate a summary sentence for the personality profile
 */
const generateSummary = (
  archetype: string,
  dominantGenre: string,
  discoveryTrend: string,
  signatureArtists: readonly string[]
): string => {
  const artistNote =
    signatureArtists.length > 0
      ? ` Signature sound anchored by ${signatureArtists.slice(0, 2).join(" and ")}.`
      : "";
  return `${archetype} with a ${dominantGenre} foundation, ${discoveryTrend}.${artistNote}`;
};

/**
 * Analyze the listener's playlist personality across all historical weeks
 * Returns null if fewer than MIN_WEEKS_FOR_PERSONALITY weeks of data
 */
export const analyzePersonality = (
  currentStats: PersonalityStats,
  currentJourney: readonly { readonly artist: string }[],
  allAnalyses: readonly ValidatedAnalysis[]
): PlaylistPersonality | null => {
  const totalWeeks = allAnalyses.length + 1; // +1 for current
  if (totalWeeks < MIN_WEEKS_FOR_PERSONALITY) {
    return null;
  }

  // Collect all discovery scores (historical + current)
  const discoveryScores = [
    ...allAnalyses.map((a) => a.stats.discoveryScore.score),
    currentStats.discoveryScore.score,
  ];

  // Collect all primary genres (historical + current)
  const primaryGenres = [
    ...allAnalyses.map((a) => a.stats.genres.primaryGenre),
    currentStats.genres.primaryGenre,
  ];

  const averageDiscoveryScore = average(discoveryScores);
  const discoveryTrend = calculateDiscoveryTrend(discoveryScores);
  const dominantGenre = findDominantGenre(primaryGenres);
  const genreFluidity = calculateGenreFluidity(primaryGenres);
  const averageRotationRate = calculateRotationRate(allAnalyses);
  const signatureArtists = findSignatureArtists(allAnalyses, currentJourney);
  const listenerArchetype = determineArchetype(averageDiscoveryScore, genreFluidity);
  const summary = generateSummary(
    listenerArchetype,
    dominantGenre,
    discoveryTrend,
    signatureArtists
  );

  return {
    averageDiscoveryScore,
    discoveryTrend,
    dominantGenre,
    genreFluidity,
    averageRotationRate,
    signatureArtists: [...signatureArtists],
    listenerArchetype,
    summary,
  };
};
