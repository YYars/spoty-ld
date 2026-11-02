/**
 * Discovery score calculation - pure functions
 */

import type { PlaylistedTrack, DiscoveryScore } from "../spotify/types.js";

/**
 * Popularity tier categorization
 */
type PopularityTier = "underground" | "midTier" | "mainstream";

/**
 * Categorize a track by its popularity
 */
const categorizeTier = (popularity: number): PopularityTier => {
  if (popularity < 20) {
    return "underground";
  }
  if (popularity < 60) {
    return "midTier";
  }
  return "mainstream";
};

/**
 * Tier counts accumulator type
 */
interface TierCounts {
  readonly underground: number;
  readonly midTier: number;
  readonly mainstream: number;
}

/**
 * Count tracks by popularity tier using reduce
 */
const countByTier = (tracks: readonly PlaylistedTrack[]): TierCounts =>
  tracks.reduce<TierCounts>(
    (acc, track) => {
      const tier = categorizeTier(track.track.popularity);
      return { ...acc, [tier]: acc[tier] + 1 };
    },
    { underground: 0, midTier: 0, mainstream: 0 }
  );

/**
 * Calculate discovery score - how underground is this week's selection
 * Pure function - no side effects, no mutations
 *
 * Score calculation:
 * - Underground tracks (< 20 popularity) = 100 points each
 * - Mid-tier tracks (20-59 popularity) = 50 points each
 * - Mainstream tracks (>= 60 popularity) = 0 points each
 * - Final score = weighted average (0-100 scale)
 */
export const calculateDiscoveryScore = (tracks: readonly PlaylistedTrack[]): DiscoveryScore => {
  const counts = countByTier(tracks);
  const total = tracks.length;

  const percentUnderground = total > 0 ? Math.round((counts.underground / total) * 100) : 0;

  const score =
    total > 0 ? Math.round((counts.underground * 100 + counts.midTier * 50) / total) : 0;

  return {
    score,
    undergroundPicks: counts.underground,
    mainstreamHits: counts.mainstream,
    midTier: counts.midTier,
    percentUnderground,
  };
};
