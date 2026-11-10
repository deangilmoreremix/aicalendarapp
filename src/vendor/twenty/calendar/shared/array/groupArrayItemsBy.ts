/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/utils/array/groupArrayItemsBy.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
// Groups are keyed by computeGroupKey, so a key no item produces is absent rather than empty
export const groupArrayItemsBy = <ArrayItem, Key extends string | number>(
  array: ArrayItem[],
  computeGroupKey: (item: ArrayItem) => Key,
) =>
  array.reduce<Partial<Record<Key, ArrayItem[]>>>((result, item) => {
    const groupKey = computeGroupKey(item);
    const previousGroup = result[groupKey] || [];

    return {
      ...result,
      [groupKey]: [...previousGroup, item],
    };
  }, {});
