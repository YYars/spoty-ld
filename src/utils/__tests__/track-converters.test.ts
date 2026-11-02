import { describe, it, expect } from "vitest";
import {
  toTrackHighlight,
  toTrackCard,
  sortByPopularityDesc,
  sortByPopularityAsc,
  filterBelowPopularity,
} from "../track-converters.js";
import type { PlaylistedTrack } from "../../spotify/types.js";

const makeTrack = (overrides: {
  id?: string;
  name?: string;
  popularity?: number;
  artists?: { id: string; name: string }[];
  albumArt?: string;
}): PlaylistedTrack => ({
  added_at: "2026-02-16T00:00:00Z",
  track: {
    id: overrides.id ?? "track-1",
    name: overrides.name ?? "Test Track",
    duration_ms: 200000,
    popularity: overrides.popularity ?? 50,
    explicit: false,
    artists: overrides.artists ?? [{ id: "artist-1", name: "Test Artist" }],
    album: {
      id: "album-1",
      name: "Test Album",
      release_date: "2026-01-01",
      images: [
        { url: overrides.albumArt ?? "https://example.com/art.jpg", width: 640, height: 640 },
      ],
    },
  },
});

describe("toTrackHighlight", () => {
  it("extracts id, name, artist, popularity", () => {
    const track = makeTrack({ id: "abc", name: "My Song", popularity: 42 });
    const result = toTrackHighlight(track);
    expect(result).toEqual({
      id: "abc",
      name: "My Song",
      artist: "Test Artist",
      popularity: 42,
    });
  });

  it("joins multiple artists with comma", () => {
    const track = makeTrack({
      artists: [
        { id: "a1", name: "Alice" },
        { id: "a2", name: "Bob" },
      ],
    });
    expect(toTrackHighlight(track).artist).toBe("Alice, Bob");
  });
});

describe("toTrackCard", () => {
  it("includes album art and spotify URL", () => {
    const track = makeTrack({ id: "xyz", albumArt: "https://img.com/cover.jpg" });
    const result = toTrackCard(track);
    expect(result.albumArt).toBe("https://img.com/cover.jpg");
    expect(result.spotifyUrl).toBe("https://open.spotify.com/track/xyz");
  });
});

describe("sortByPopularityDesc", () => {
  it("sorts most popular first", () => {
    const tracks = [
      makeTrack({ popularity: 10 }),
      makeTrack({ popularity: 90 }),
      makeTrack({ popularity: 50 }),
    ];
    const sorted = sortByPopularityDesc(tracks);
    expect(sorted.map((t) => t.track.popularity)).toEqual([90, 50, 10]);
  });

  it("does not mutate the original array", () => {
    const tracks = [makeTrack({ popularity: 10 }), makeTrack({ popularity: 90 })];
    sortByPopularityDesc(tracks);
    expect(tracks[0].track.popularity).toBe(10);
  });
});

describe("sortByPopularityAsc", () => {
  it("sorts least popular first", () => {
    const tracks = [makeTrack({ popularity: 90 }), makeTrack({ popularity: 10 })];
    const sorted = sortByPopularityAsc(tracks);
    expect(sorted.map((t) => t.track.popularity)).toEqual([10, 90]);
  });
});

describe("filterBelowPopularity", () => {
  it("filters tracks below threshold", () => {
    const tracks = [
      makeTrack({ popularity: 10 }),
      makeTrack({ popularity: 50 }),
      makeTrack({ popularity: 39 }),
    ];
    const result = filterBelowPopularity(40)(tracks);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.track.popularity < 40)).toBe(true);
  });
});
