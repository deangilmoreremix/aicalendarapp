/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/date/parseToInstantOrThrow.ts
 * Changes: import paths. Logic unchanged.
 */
import { isValid, parse } from 'date-fns';
import { Temporal } from 'temporal-polyfill';

import { NON_ISO_DATE_FORMATS } from './dateInputFormats';
import { turnJSDateToPlainDate } from './turnJSDateToPlainDate';
import { isDefined } from './isDefined';

const getIsoInstant = (stringDateTime: string): Temporal.Instant | null => {
  try {
    return Temporal.Instant.from(stringDateTime);
  } catch {
    try {
      return Temporal.PlainDateTime.from(stringDateTime)
        .toZonedDateTime('UTC')
        .toInstant();
    } catch {
      return null;
    }
  }
};

const isYearWrittenInFull = ({
  stringDateTime,
  parsedDate,
}: {
  stringDateTime: string;
  parsedDate: Date;
}) =>
  stringDateTime.includes(parsedDate.getFullYear().toString().padStart(4, '0'));

export const parseToInstantOrThrow = (
  stringDateTime: string,
): Temporal.Instant => {
  const isoInstant = getIsoInstant(stringDateTime);

  if (isDefined(isoInstant)) {
    return isoInstant;
  }

  for (const format of NON_ISO_DATE_FORMATS) {
    const parsedDate = parse(stringDateTime, format, new Date());

    if (
      isValid(parsedDate) &&
      isYearWrittenInFull({ stringDateTime, parsedDate })
    ) {
      return turnJSDateToPlainDate(parsedDate)
        .toZonedDateTime('UTC')
        .toInstant();
    }
  }

  throw new Error(
    `Cannot parse date-time string as Instant: "${stringDateTime}"`,
  );
};
