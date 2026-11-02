/**
 * Artist diversity analysis - pure functions
 */

import type { PlaylistedTrack, ArtistDiversity } from "../spotify/types.js";
import { countBy, calculateStats } from "../utils/fp.js";

/**
 * Extract all artist names from tracks
 */
const extractArtistNames = (tracks: readonly PlaylistedTrack[]): readonly string[] =>
  tracks.flatMap((track) => track.track.artists.map((a) => a.name));

/**
 * Find artists who appear more than once
 */
const findRepeatArtists = (artistCounts: ReadonlyMap<string, number>): readonly string[] =>
  [...artistCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name);

/**
 * Extract artist popularities from tracks using artist map
 */
const extractArtistPopularities = (
  tracks: readonly PlaylistedTrack[],
  artistsMap: ReadonlyMap<string, { readonly popularity: number }>
): readonly number[] =>
  tracks.flatMap((track) =>
    track.track.artists
      .map((a) => artistsMap.get(a.id)?.popularity)
      .filter((p): p is number => p !== undefined)
  );

/**
 * Calculate artist diversity metrics
 * Pure function - no side effects, no mutations
 */
export const calculateArtistDiversity = (
  tracks: readonly PlaylistedTrack[],
  artistsMap: ReadonlyMap<string, { readonly popularity: number }>
): ArtistDiversity => {
  const artistNames = extractArtistNames(tracks);
  const artistCounts = countBy(artistNames, (name) => name);
  const popularities = extractArtistPopularities(tracks, artistsMap);
  const stats = calculateStats([...popularities]);

  return {
    uniqueArtists: artistCounts.size,
    totalArtistAppearances: [...artistCounts.values()].reduce((a, b) => a + b, 0),
    repeatArtists: [...findRepeatArtists(artistCounts)],
    artistPopularitySpread: {
      min: stats.min,
      max: stats.max,
      average: Math.round(stats.average),
    },
  };
};
