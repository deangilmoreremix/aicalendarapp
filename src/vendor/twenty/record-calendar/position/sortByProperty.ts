/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/utils/array/sortByProperty.ts
 * Changes: import paths only.
 */
import { type ArraySortDirection } from './ArraySortDirection';
import { doNotTranslate } from '../shared/doNotTranslate';

export const sortByProperty =
  <T, K extends keyof T>(propertyName: K, sortBy: ArraySortDirection = 'asc') =>
  (objectA: T, objectB: T) => {
    const a = sortBy === 'asc' ? objectA : objectB;
    const b = sortBy === 'asc' ? objectB : objectA;

    if (typeof a[propertyName] === 'string') {
      return (a[propertyName] as string).localeCompare(
        b[propertyName] as string,
      );
    } else if (typeof a[propertyName] === 'number') {
      return (a[propertyName] as number) - (b[propertyName] as number);
    }
    throw new Error(
      doNotTranslate(
        'Property type not supported in sortByProperty, only string and number are supported',
      ),
    );
  };
