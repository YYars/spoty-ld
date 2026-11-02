/**
 * Spotify API client with dependency injection
 */

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { PlaylistedTrack, Track, Artist } from "./types.js";

/**
 * Spotify client configuration
 */
export interface SpotifyConfig {
  readonly clientId: string;
  readonly clientSecret: string;
}

/**
 * Spotify client interface for testability
 */
export interface SpotifyClient {
  readonly getPlaylistTracks: (playlistId: string) => Promise<readonly PlaylistedTrack[]>;
  readonly getArtists: (artistIds: readonly string[]) => Promise<ReadonlyMap<string, Artist>>;
}

/**
 * Process items in batches and combine results
 */
const processBatches = async <T, R>(
  items: readonly T[],
  batchSize: number,
  processor: (batch: readonly T[]) => Promise<readonly R[]>
): Promise<readonly R[]> => {
  const batches = Array.from({ length: Math.ceil(items.length / batchSize) }, (_, i) =>
    items.slice(i * batchSize, (i + 1) * batchSize)
  );

  const results = await Promise.all(batches.map(processor));
  return results.flat();
};

/**
 * Create Spotify client factory
 */
export const createSpotifyClient = (config: SpotifyConfig): SpotifyClient => {
  const api = SpotifyApi.withClientCredentials(config.clientId, config.clientSecret);

  /**
   * Fetch playlist tracks with recursive pagination
   */
  const fetchPlaylistPage = async (
    playlistId: string,
    offset: number
  ): Promise<readonly PlaylistedTrack[]> => {
    const limit = 50;
    const response = await api.playlists.getPlaylistItems(
      playlistId,
      undefined,
      undefined,
      limit,
      offset
    );

    const tracks = response.items
      .filter((item) => item.track?.type === "track")
      .map((item) => ({
        added_at: item.added_at,
        track: item.track as Track,
      }));

    // Base case: no more pages
    if (response.next === null || response.items.length < limit) {
      return tracks;
    }

    // Recursive case: fetch next page and combine
    const nextTracks = await fetchPlaylistPage(playlistId, offset + limit);
    return [...tracks, ...nextTracks];
  };

  return {
    getPlaylistTracks: (playlistId) => fetchPlaylistPage(playlistId, 0),

    getArtists: async (artistIds) => {
      const uniqueIds = [...new Set(artistIds)];

      const results = await processBatches(uniqueIds, 50, async (batch) => {
        const response = await api.artists.get([...batch]);
        return response.map((artist) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          popularity: artist.popularity,
        }));
      });

      return new Map(results.map((artist) => [artist.id, artist]));
    },
  };
};
