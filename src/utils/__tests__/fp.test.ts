import { describe, it, expect } from "vitest";
import { pipe, sum, average, groupBy, countBy, incrementCount, calculateStats } from "../fp.js";

describe("pipe", () => {
  it("applies functions left-to-right", () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    expect(pipe(add1, double)(3)).toBe(8); // (3+1)*2
  });

  it("returns initial value with no functions", () => {
    expect(pipe<number>()(5)).toBe(5);
  });
});

describe("sum", () => {
  it("sums numbers", () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  it("returns 0 for empty array", () => {
    expect(sum([])).toBe(0);
  });
});

describe("average", () => {
  it("calculates average", () => {
    expect(average([2, 4, 6])).toBe(4);
  });

  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });
});

describe("groupBy", () => {
  it("groups items by key function", () => {
    const result = groupBy(["apple", "avocado", "banana"], (s) => s[0]);
    expect(result.get("a")).toEqual(["apple", "avocado"]);
    expect(result.get("b")).toEqual(["banana"]);
  });

  it("returns empty map for empty array", () => {
    const result = groupBy([], (x: string) => x);
    expect(result.size).toBe(0);
  });
});

describe("countBy", () => {
  it("counts occurrences", () => {
    const result = countBy(["a", "b", "a", "c", "a"], (x) => x);
    expect(result.get("a")).toBe(3);
    expect(result.get("b")).toBe(1);
    expect(result.get("c")).toBe(1);
  });
});

describe("incrementCount", () => {
  it("increments existing key", () => {
    const map = new Map([["a", 2]]);
    const result = incrementCount(map, "a");
    expect(result.get("a")).toBe(3);
  });

  it("creates new key with amount", () => {
    const map = new Map<string, number>();
    const result = incrementCount(map, "x", 5);
    expect(result.get("x")).toBe(5);
  });

  it("does not mutate original map", () => {
    const map = new Map([["a", 1]]);
    incrementCount(map, "a");
    expect(map.get("a")).toBe(1);
  });
});

describe("calculateStats", () => {
  it("calculates min, max, average", () => {
    const result = calculateStats([10, 20, 30]);
    expect(result.min).toBe(10);
    expect(result.max).toBe(30);
    expect(result.average).toBe(20);
  });

  it("handles single element", () => {
    const result = calculateStats([42]);
    expect(result.min).toBe(42);
    expect(result.max).toBe(42);
    expect(result.average).toBe(42);
  });

  it("returns zeros for empty array", () => {
    const result = calculateStats([]);
    expect(result).toEqual({ min: 0, max: 0, average: 0 });
  });
});
