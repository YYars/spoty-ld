/**
 * Genre analysis - pure functions
 * Analyzes genres and creates Instagram-friendly summaries
 */

import type { GenreAnalysisResult, GenreBreakdown } from "../spotify/types.js";
import { GENRE_GROUPS, MAX_ENTROPY, type GenreCategory } from "./genre-mapping.js";

/**
 * Map a Spotify genre to its parent category using best-match scoring.
 * When a genre matches keywords in multiple categories, the longest
 * (most specific) keyword wins. Exact matches get a large bonus.
 */
export const categorizeGenre = (genre: string): GenreCategory | null => {
  const lowerGenre = genre.toLowerCase();

  let bestCategory: GenreCategory | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(GENRE_GROUPS)) {
    for (const keyword of keywords) {
      if (lowerGenre.includes(keyword)) {
        const score = keyword === lowerGenre ? keyword.length + 1000 : keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category as GenreCategory;
        }
      }
    }
  }

  return bestCategory;
};

/**
 * Sort raw genres by count descending
 */
const sortRawGenres = (
  genreCounts: ReadonlyMap<string, number>
): readonly { readonly genre: string; readonly count: number }[] =>
  [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

/**
 * Group genres into categories using reduce
 */
const groupIntoCategories = (
  genreCounts: ReadonlyMap<string, number>
): {
  readonly categoryCounts: ReadonlyMap<GenreCategory, number>;
  readonly totalCategorized: number;
} =>
  [...genreCounts.entries()].reduce(
    (acc, [genre, count]) => {
      const category = categorizeGenre(genre);
      if (!category) {
        return acc;
      }

      return {
        categoryCounts: new Map(acc.categoryCounts).set(
          category,
          (acc.categoryCounts.get(category) ?? 0) + count
        ),
        totalCategorized: acc.totalCategorized + count,
      };
    },
    {
      categoryCounts: new Map<GenreCategory, number>(),
      totalCategorized: 0,
    }
  );

/**
 * Convert category counts to sorted breakdown array
 */
const toSortedBreakdown = (
  categoryCounts: ReadonlyMap<GenreCategory, number>,
  totalCategorized: number
): readonly GenreBreakdown[] =>
  [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

/**
 * Calculate Shannon entropy-based diversity score
 * Returns 0-100 where higher = more diverse
 */
const calculateDiversityScore = (
  groupedGenres: readonly GenreBreakdown[],
  totalCategorized: number
): number => {
  if (groupedGenres.length <= 1 || totalCategorized === 0) {
    return 0;
  }

  const entropy = groupedGenres.reduce((acc, g) => {
    const p = g.count / totalCategorized;
    return p > 0 ? acc - p * Math.log2(p) : acc;
  }, 0);

  // Normalize to 0-100
  return Math.round((entropy / MAX_ENTROPY) * 100);
};

/**
 * Analyze genres and create Instagram-friendly summaries
 * Pure function - no side effects
 */
export const analyzeGenres = (genreCounts: ReadonlyMap<string, number>): GenreAnalysisResult => {
  const rawGenres = sortRawGenres(genreCounts);
  const { categoryCounts, totalCategorized } = groupIntoCategories(genreCounts);
  const groupedGenres = toSortedBreakdown(categoryCounts, totalCategorized);

  const primaryGenre = groupedGenres[0]?.category ?? "Mixed";
  const significantCategories = groupedGenres.filter((g) => g.percentage >= 20);
  const isMultiGenre = significantCategories.length >= 2;
  const diversityScore = calculateDiversityScore(groupedGenres, totalCategorized);

  return {
    rawGenres: rawGenres.slice(0, 10).map((g) => ({ ...g })), // Top 10 raw genres
    groupedGenres: groupedGenres.map((g) => ({ ...g })),
    primaryGenre,
    isMultiGenre,
    diversityScore,
  };
};
