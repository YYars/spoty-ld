/**
 * Weekly stats analysis - orchestration layer
 */

import type { PlaylistedTrack, WeeklyStats, TrackHighlight, Artist } from "../spotify/types.js";
import { analyzeGenres } from "./genres.js";
import { calculateArtistDiversity } from "./artist-diversity.js";
import { calculateDiscoveryScore } from "./discovery-score.js";
import {
  toTrackHighlight,
  sortByPopularityDesc,
  sortByPopularityAsc,
  filterBelowPopularity,
} from "../utils/track-converters.js";
import { incrementCount } from "../utils/fp.js";

const DEEP_CUT_THRESHOLD = 40;

/**
 * Find deep cuts (tracks with low popularity)
 * Returns all qualifying tracks, or fallback to least popular if none qualify
 */
const findDeepCuts = (sortedTracks: readonly PlaylistedTrack[]): readonly TrackHighlight[] => {
  const deepCuts = [...filterBelowPopularity(DEEP_CUT_THRESHOLD)(sortedTracks)]
    .reverse() // Most obscure first (lowest popularity)
    .map(toTrackHighlight);

  // One deep cut per artist (keep most obscure)
  const seenArtists = new Set<string>();
  const uniqueDeepCuts = deepCuts.filter((track) => {
    if (seenArtists.has(track.artist)) {
      return false;
    }
    seenArtists.add(track.artist);
    return true;
  });

  // Fallback: if no tracks qualify, use the single least popular track
  return uniqueDeepCuts.length > 0 ? uniqueDeepCuts : [toTrackHighlight(sortedTracks[sortedTracks.length - 1])];
};

/**
 * Find last week's gem (most obscure track from last week)
 */
const findLastWeekGem = (lastWeekTracks: readonly PlaylistedTrack[]): TrackHighlight | null => {
  if (lastWeekTracks.length === 0) {
    return null;
  }
  const sorted = sortByPopularityAsc(lastWeekTracks);
  return toTrackHighlight(sorted[0]);
};

/**
 * Count genres from tracks using artist data
 * Pure function using flatMap and reduce
 */
const countGenresFromTracks = (
  tracks: readonly PlaylistedTrack[],
  artists: ReadonlyMap<string, Artist>
): ReadonlyMap<string, number> =>
  tracks
    .flatMap((track) =>
      track.track.artists.flatMap((artist) => artists.get(artist.id)?.genres ?? [])
    )
    .reduce<
      ReadonlyMap<string, number>
    >((acc, genre) => incrementCount(acc, genre), new Map<string, number>());

/**
 * Function type for fetching artist data (enables dependency injection for testing)
 */
export type ArtistFetcher = (artistIds: readonly string[]) => Promise<ReadonlyMap<string, Artist>>;

/**
 * Analyze weekly stats for the new tracks
 */
export async function analyzeStats(
  newTracks: readonly PlaylistedTrack[],
  lastWeekTracks: readonly PlaylistedTrack[],
  weekOf: string,
  fetchArtists: ArtistFetcher
): Promise<WeeklyStats> {
  const sortedByPopularity = sortByPopularityDesc(newTracks);
  const mostPopular = sortedByPopularity[0];

  // Get artist data for genre analysis
  const artistIds = newTracks.flatMap((t) => t.track.artists.map((a) => a.id));
  const artists = await fetchArtists(artistIds);

  // Count genres from tracks
  const genreCounts = countGenresFromTracks(newTracks, artists);

  return {
    weekOf,
    newTracksCount: newTracks.length,
    mostPopular: toTrackHighlight(mostPopular),
    deepCuts: [...findDeepCuts(sortedByPopularity)],
    lastWeekGem: findLastWeekGem(lastWeekTracks),
    genres: analyzeGenres(genreCounts),
    artistDiversity: calculateArtistDiversity(newTracks, artists),
    discoveryScore: calculateDiscoveryScore(newTracks),
  };
}
