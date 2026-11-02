import { describe, it, expect } from "vitest";
import { separateTracksByWeek } from "../week-separator.js";
import type { PlaylistedTrack } from "../../spotify/types.js";

const makeTrack = (addedAt: string, name: string = "Track"): PlaylistedTrack => ({
  added_at: addedAt,
  track: {
    id: `id-${name}`,
    name,
    duration_ms: 200000,
    popularity: 50,
    explicit: false,
    artists: [{ id: "a1", name: "Artist" }],
    album: {
      id: "al1",
      name: "Album",
      release_date: "2026-01-01",
      images: [],
    },
  },
});

describe("separateTracksByWeek", () => {
  it("returns empty arrays for empty input", () => {
    const result = separateTracksByWeek([]);
    expect(result.thisWeek).toEqual([]);
    expect(result.lastWeek).toEqual([]);
  });

  it("puts all tracks in thisWeek if all same day", () => {
    const tracks = [makeTrack("2026-02-16T10:00:00Z", "A"), makeTrack("2026-02-16T14:00:00Z", "B")];
    const result = separateTracksByWeek(tracks);
    expect(result.thisWeek).toHaveLength(2);
    expect(result.lastWeek).toHaveLength(0);
  });

  it("separates tracks by most recent day", () => {
    const tracks = [
      makeTrack("2026-02-16T10:00:00Z", "New"),
      makeTrack("2026-02-09T10:00:00Z", "Old"),
      makeTrack("2026-02-16T14:00:00Z", "New2"),
    ];
    const result = separateTracksByWeek(tracks);
    expect(result.thisWeek).toHaveLength(2);
    expect(result.lastWeek).toHaveLength(1);
    expect(result.lastWeek[0].track.name).toBe("Old");
  });

  it("preserves original track order within each group", () => {
    const tracks = [
      makeTrack("2026-02-16T10:00:00Z", "First"),
      makeTrack("2026-02-09T10:00:00Z", "Old"),
      makeTrack("2026-02-16T14:00:00Z", "Second"),
    ];
    const result = separateTracksByWeek(tracks);
    expect(result.thisWeek.map((t) => t.track.name)).toEqual(["First", "Second"]);
  });
});
