/**
 * Week separation utilities - pure functions
 */

import type { PlaylistedTrack } from "../spotify/types.js";

/**
 * Week separation result
 */
export interface WeekSeparation {
  readonly thisWeek: readonly PlaylistedTrack[];
  readonly lastWeek: readonly PlaylistedTrack[];
}

/**
 * Convert Date to YYYY-MM-DD string
 */
const toDateString = (date: Date): string => date.toISOString().split("T")[0];

/**
 * Find the most recent date from tracks
 */
const findMostRecentDate = (tracks: readonly PlaylistedTrack[]): Date =>
  tracks.reduce((latest, track) => {
    const trackDate = new Date(track.added_at);
    return trackDate > latest ? trackDate : latest;
  }, new Date(tracks[0].added_at));

/**
 * Separate tracks into "this week" (most recent additions) and "last week" (older)
 * Based on the added_at timestamp, while preserving the original playlist order
 *
 * Pure function using reduce instead of mutable arrays
 */
export const separateTracksByWeek = (tracks: readonly PlaylistedTrack[]): WeekSeparation => {
  if (tracks.length === 0) {
    return { thisWeek: [], lastWeek: [] };
  }

  const mostRecentDay = toDateString(findMostRecentDate(tracks));

  return tracks.reduce<WeekSeparation>(
    (acc, track) => {
      const trackDay = toDateString(new Date(track.added_at));
      return trackDay === mostRecentDay
        ? { ...acc, thisWeek: [...acc.thisWeek, track] }
        : { ...acc, lastWeek: [...acc.lastWeek, track] };
    },
    { thisWeek: [], lastWeek: [] }
  );
};
