/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/blocklist/utils/is-email-blocklisted.util.ts
 * Changes: import paths. Logic unchanged.
 */
import { getDomainFromEmail } from './get-domain-from-email';

export const isEmailBlocklisted = (
  channelHandle: string[],
  email: string | null | undefined,
  blocklist: string[],
): boolean => {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();

  if (
    channelHandle.some((handle) => handle.toLowerCase() === normalizedEmail)
  ) {
    return false;
  }

  const domain = getDomainFromEmail(normalizedEmail);

  return blocklist.some((rawItem) => {
    const item = rawItem.toLowerCase();

    if (item.startsWith('@')) {
      const bareDomain = item.slice(1);

      return (
        domain === bareDomain || (domain?.endsWith(`.${bareDomain}`) ?? false)
      );
    }

    return normalizedEmail === item;
  });
};
