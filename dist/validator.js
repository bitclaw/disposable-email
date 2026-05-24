import { DISPOSABLE_DOMAINS } from './domains';
/**
 * Check if an email address uses a known disposable/temporary email domain.
 * @param email - Email address to check
 * @returns true if the domain is a known disposable email provider
 */
export function isDisposableEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain)
        return false;
    return DISPOSABLE_DOMAINS.has(domain);
}
