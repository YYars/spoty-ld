/**
 * Pure functions for converting track data structures
 */

import type { PlaylistedTrack, TrackHighlight, TrackCard } from "../spotify/types.js";

/**
 * Convert PlaylistedTrack to TrackHighlight
 */
export const toTrackHighlight = (track: PlaylistedTrack): TrackHighlight => ({
  id: track.track.id,
  name: track.track.name,
  artist: track.track.artists.map((a) => a.name).join(", "),
  popularity: track.track.popularity,
});

/**
 * Convert PlaylistedTrack to TrackCard (includes album art and URL)
 */
export const toTrackCard = (item: PlaylistedTrack): TrackCard => ({
  name: item.track.name,
  artist: item.track.artists.map((a) => a.name).join(", "),
  albumArt: item.track.album.images[0]?.url ?? "",
  popularity: item.track.popularity,
  spotifyUrl: `https://open.spotify.com/track/${item.track.id}`,
});

/**
 * Sort tracks by popularity (descending - most popular first)
 */
export const sortByPopularityDesc = (
  tracks: readonly PlaylistedTrack[]
): readonly PlaylistedTrack[] =>
  [...tracks].sort((a, b) => b.track.popularity - a.track.popularity);

/**
 * Sort tracks by popularity (ascending - least popular first)
 */
export const sortByPopularityAsc = (
  tracks: readonly PlaylistedTrack[]
): readonly PlaylistedTrack[] =>
  [...tracks].sort((a, b) => a.track.popularity - b.track.popularity);

/**
 * Filter tracks below popularity threshold
 */
export const filterBelowPopularity =
  (threshold: number) =>
  (tracks: readonly PlaylistedTrack[]): readonly PlaylistedTrack[] =>
    tracks.filter((t) => t.track.popularity < threshold);
