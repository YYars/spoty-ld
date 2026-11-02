import { describe, it, expect } from "vitest";
import { analyzeGenres, categorizeGenre } from "../genres.js";

describe("categorizeGenre — best-match scoring", () => {
  it("maps 'soul jazz' to Jazz (not R&B/Soul)", () => {
    expect(categorizeGenre("soul jazz")).toBe("Jazz");
  });

  it("maps 'art pop' to Pop (exact match over 'art' in Experimental)", () => {
    expect(categorizeGenre("art pop")).toBe("Pop");
  });

  it("maps 'experimental hip hop' to Hip-Hop (compound keyword)", () => {
    expect(categorizeGenre("experimental hip hop")).toBe("Hip-Hop");
  });

  it("maps 'bedroom pop' to Pop", () => {
    expect(categorizeGenre("bedroom pop")).toBe("Pop");
  });

  it("maps 'indie rock' to Rock (exact match)", () => {
    expect(categorizeGenre("indie rock")).toBe("Rock");
  });

  it("maps 'jazz fusion' to Jazz (longer 'jazz fusion' is not a keyword, but 'fusion' and 'jazz' both match)", () => {
    // "jazz" (4) matches Jazz, "fusion" (6) matches Jazz — Jazz wins
    expect(categorizeGenre("jazz fusion")).toBe("Jazz");
  });

  it("returns null for unrecognized genres", () => {
    expect(categorizeGenre("underwater basket weaving")).toBeNull();
  });
});

describe("analyzeGenres", () => {
  it("identifies primary genre", () => {
    const genres = new Map([
      ["hip hop", 5],
      ["trap", 3],
      ["jazz", 1],
    ]);
    const result = analyzeGenres(genres);
    expect(result.primaryGenre).toBe("Hip-Hop");
  });

  it("detects multi-genre when 2+ categories >= 20%", () => {
    const genres = new Map([
      ["hip hop", 3],
      ["jazz", 3],
      ["pop", 1],
    ]);
    const result = analyzeGenres(genres);
    expect(result.isMultiGenre).toBe(true);
  });

  it("detects single-genre when one category dominates", () => {
    const genres = new Map([
      ["hip hop", 10],
      ["jazz", 1],
    ]);
    const result = analyzeGenres(genres);
    expect(result.isMultiGenre).toBe(false);
  });

  it("returns top 10 raw genres", () => {
    const genres = new Map(
      Array.from({ length: 15 }, (_, i) => [`genre-${i}`, 15 - i] as [string, number])
    );
    const result = analyzeGenres(genres);
    expect(result.rawGenres).toHaveLength(10);
    expect(result.rawGenres[0].count).toBeGreaterThanOrEqual(result.rawGenres[9].count);
  });

  it("calculates diversity score > 0 for multiple categories", () => {
    const genres = new Map([
      ["hip hop", 3],
      ["jazz", 3],
      ["rock", 3],
      ["pop", 3],
    ]);
    const result = analyzeGenres(genres);
    expect(result.diversityScore).toBeGreaterThan(0);
  });

  it("returns 0 diversity for single category", () => {
    const genres = new Map([
      ["hip hop", 5],
      ["trap", 3],
      ["rap", 2],
    ]);
    const result = analyzeGenres(genres);
    // All map to Hip-Hop category, so only 1 group
    expect(result.diversityScore).toBe(0);
  });

  it("handles empty genre map", () => {
    const result = analyzeGenres(new Map());
    expect(result.primaryGenre).toBe("Mixed");
    expect(result.rawGenres).toHaveLength(0);
    expect(result.groupedGenres).toHaveLength(0);
  });
});
