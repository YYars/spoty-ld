import { describe, it, expect } from "vitest";
import { calculateArtistDiversity } from "../artist-diversity.js";
import type { PlaylistedTrack } from "../../spotify/types.js";

const makeTrack = (artists: { id: string; name: string }[]): PlaylistedTrack => ({
  added_at: "2026-02-16T00:00:00Z",
  track: {
    id: "track-1",
    name: "Track",
    duration_ms: 200000,
    popularity: 50,
    explicit: false,
    artists,
    album: { id: "al1", name: "Album", release_date: "2026-01-01", images: [] },
  },
});

describe("calculateArtistDiversity", () => {
  it("counts unique artists", () => {
    const tracks = [
      makeTrack([{ id: "a1", name: "Alice" }]),
      makeTrack([{ id: "a2", name: "Bob" }]),
      makeTrack([{ id: "a1", name: "Alice" }]),
    ];
    const artistsMap = new Map([
      ["a1", { popularity: 60 }],
      ["a2", { popularity: 40 }],
    ]);
    const result = calculateArtistDiversity(tracks, artistsMap);
    expect(result.uniqueArtists).toBe(2);
  });

  it("identifies repeat artists", () => {
    const tracks = [
      makeTrack([{ id: "a1", name: "Alice" }]),
      makeTrack([{ id: "a1", name: "Alice" }]),
      makeTrack([{ id: "a2", name: "Bob" }]),
    ];
    const artistsMap = new Map([
      ["a1", { popularity: 60 }],
      ["a2", { popularity: 40 }],
    ]);
    const result = calculateArtistDiversity(tracks, artistsMap);
    expect(result.repeatArtists).toEqual(["Alice"]);
  });

  it("calculates total appearances", () => {
    const tracks = [
      makeTrack([
        { id: "a1", name: "Alice" },
        { id: "a2", name: "Bob" },
      ]),
      makeTrack([{ id: "a1", name: "Alice" }]),
    ];
    const artistsMap = new Map([
      ["a1", { popularity: 60 }],
      ["a2", { popularity: 40 }],
    ]);
    const result = calculateArtistDiversity(tracks, artistsMap);
    expect(result.totalArtistAppearances).toBe(3);
  });

  it("calculates popularity spread", () => {
    const tracks = [
      makeTrack([{ id: "a1", name: "Alice" }]),
      makeTrack([{ id: "a2", name: "Bob" }]),
    ];
    const artistsMap = new Map([
      ["a1", { popularity: 20 }],
      ["a2", { popularity: 80 }],
    ]);
    const result = calculateArtistDiversity(tracks, artistsMap);
    expect(result.artistPopularitySpread.min).toBe(20);
    expect(result.artistPopularitySpread.max).toBe(80);
    expect(result.artistPopularitySpread.average).toBe(50);
  });
});
