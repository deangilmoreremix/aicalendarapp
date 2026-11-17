/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-shared/src/i18n/do-not-translate.ts
 * Changes: import paths only.
 */
// The Lingui lint gate skips arguments of this call: use it for text that must stay as written.
export const doNotTranslate = <TValue>(value: TValue): TValue => value;
