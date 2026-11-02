/**
 * Fresh release detection - identifies tracks from recently released albums
 * Pure functions - no side effects
 */

import type {
  PlaylistedTrack,
  FreshnessAnalysis,
  FreshnessTier,
  TierBreakdown,
} from "../spotify/types.js";

const FRESH_THRESHOLD_DAYS = 30;

/**
 * Calculate the number of days between two dates
 */
const daysBetween = (date1: Date, date2: Date): number =>
  Math.floor(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

/**
 * Parse a Spotify release date (can be YYYY, YYYY-MM, or YYYY-MM-DD)
 */
const parseReleaseDate = (dateStr: string): Date => {
  // Spotify returns dates in varying precision
  if (dateStr.length === 4) {
    return new Date(`${dateStr}-01-01`);
  }
  if (dateStr.length === 7) {
    return new Date(`${dateStr}-01`);
  }
  return new Date(dateStr);
};

/**
 * Assign a freshness tier based on days old
 */
const assignTier = (daysOld: number): FreshnessTier => {
  if (daysOld <= 7) {
    return "day-one";
  }
  if (daysOld <= 14) {
    return "early-bird";
  }
  return "fresh-catch";
};

/**
 * Count tracks in each tier
 */
const countTiers = (freshReleases: readonly { readonly tier: FreshnessTier }[]): TierBreakdown => ({
  dayOne: freshReleases.filter((t) => t.tier === "day-one").length,
  earlyBird: freshReleases.filter((t) => t.tier === "early-bird").length,
  freshCatch: freshReleases.filter((t) => t.tier === "fresh-catch").length,
});

/**
 * Generate a label for the freshness analysis
 */
const generateFreshnessLabel = (
  freshCount: number,
  totalTracks: number,
  tierBreakdown: TierBreakdown
): string => {
  if (freshCount === 0) {
    return "Catalog listener — no fresh releases this week";
  }

  // If majority are day-one, highlight that
  if (tierBreakdown.dayOne > freshCount / 2) {
    return `Day-one listener — ${tierBreakdown.dayOne} track${tierBreakdown.dayOne > 1 ? "s" : ""} dropped this week`;
  }

  const percentFresh = Math.round((freshCount / totalTracks) * 100);

  if (percentFresh >= 50) {
    return `Early adopter — ${freshCount}/${totalTracks} tracks are fresh releases`;
  }
  if (percentFresh >= 25) {
    return `Balanced — ${freshCount}/${totalTracks} tracks are fresh releases`;
  }
  return `Mostly catalog — ${freshCount}/${totalTracks} fresh release${freshCount > 1 ? "s" : ""}`;
};

/**
 * Analyze how many tracks are from recently released albums
 */
export const analyzeFreshness = (
  tracks: readonly PlaylistedTrack[],
  analysisDate: string
): FreshnessAnalysis => {
  const referenceDate = new Date(analysisDate);

  const freshReleases = tracks
    .map((t) => {
      const releaseDate = parseReleaseDate(t.track.album.release_date);
      const daysOld = daysBetween(releaseDate, referenceDate);
      return {
        name: t.track.name,
        artist: t.track.artists.map((a) => a.name).join(", "),
        releaseDate: t.track.album.release_date,
        daysOld,
        tier: assignTier(daysOld),
      };
    })
    .filter((t) => t.daysOld <= FRESH_THRESHOLD_DAYS)
    .sort((a, b) => a.daysOld - b.daysOld); // Newest first

  const freshCount = freshReleases.length;
  const totalTracks = tracks.length;
  const percentFresh = totalTracks > 0 ? Math.round((freshCount / totalTracks) * 100) : 0;
  const tierBreakdown = countTiers(freshReleases);

  return {
    freshReleases: [...freshReleases],
    freshCount,
    totalTracks,
    percentFresh,
    tierBreakdown,
    label: generateFreshnessLabel(freshCount, totalTracks, tierBreakdown),
  };
};
