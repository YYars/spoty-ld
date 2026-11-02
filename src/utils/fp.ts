/**
 * Functional programming utilities
 */

/**
 * Pipe functions left-to-right
 */
export const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (initial: T): T =>
    fns.reduce((acc, fn) => fn(acc), initial);

/**
 * Sum array of numbers
 */
export const sum = (nums: readonly number[]): number => nums.reduce((a, b) => a + b, 0);

/**
 * Average of array (returns 0 for empty arrays)
 */
export const average = (nums: readonly number[]): number =>
  nums.length > 0 ? sum(nums) / nums.length : 0;

/**
 * Group items by key function (returns immutable Map)
 */
export const groupBy = <T, K>(
  items: readonly T[],
  keyFn: (item: T) => K
): ReadonlyMap<K, readonly T[]> =>
  items.reduce((acc, item) => {
    const key = keyFn(item);
    const group = acc.get(key) ?? [];
    return new Map(acc).set(key, [...group, item]);
  }, new Map<K, readonly T[]>());

/**
 * Count occurrences of items
 */
export const countBy = <T, K>(items: readonly T[], keyFn: (item: T) => K): ReadonlyMap<K, number> =>
  items.reduce((acc, item) => {
    const key = keyFn(item);
    return new Map(acc).set(key, (acc.get(key) ?? 0) + 1);
  }, new Map<K, number>());

/**
 * Increment count in a Map immutably
 */
export const incrementCount = <K>(
  map: ReadonlyMap<K, number>,
  key: K,
  amount: number = 1
): ReadonlyMap<K, number> => new Map(map).set(key, (map.get(key) ?? 0) + amount);

/**
 * Find min/max/average in single pass
 */
export interface NumericStats {
  readonly min: number;
  readonly max: number;
  readonly average: number;
}

export const calculateStats = (nums: readonly number[]): NumericStats => {
  if (nums.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  const result = nums.reduce(
    (acc, num) => ({
      min: Math.min(acc.min, num),
      max: Math.max(acc.max, num),
      sum: acc.sum + num,
    }),
    { min: nums[0], max: nums[0], sum: 0 }
  );

  return {
    min: result.min,
    max: result.max,
    average: result.sum / nums.length,
  };
};
