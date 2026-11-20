/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/utils/get-domain-from-email.ts
 * Changes: import paths. Logic unchanged.
 */
export const getDomainFromEmail = (email: string): string | undefined => {
  const lastAtIndex = email.lastIndexOf('@');

  if (lastAtIndex === -1) {
    return undefined;
  }

  return email.slice(lastAtIndex + 1);
};
