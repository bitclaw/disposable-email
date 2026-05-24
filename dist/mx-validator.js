import { resolve } from 'node:dns/promises';
import { DISPOSABLE_DOMAINS } from './domains';
/**
 * Validate an email domain against the disposable blocklist and optionally
 * check DNS MX records to verify the domain can receive mail.
 *
 * @param email - Email address to validate
 * @param opts - Validation options (MX check, DNS timeout)
 * @returns Validation result with reason if invalid
 */
export async function validateEmailDomain(email, opts = {}) {
    const { checkMx = false, dnsTimeout = 5000 } = opts;
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) {
        return {
            valid: false,
            reason: 'invalid-domain',
            message: 'Invalid email address format.'
        };
    }
    // 1. Check disposable blocklist
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return {
            valid: false,
            reason: 'disposable',
            message: 'Disposable email addresses are not allowed. Please use a permanent email.'
        };
    }
    // 2. Optionally check MX records
    if (checkMx) {
        try {
            const records = await Promise.race([
                resolve(domain, 'MX'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), dnsTimeout))
            ]);
            if (!records || (Array.isArray(records) && records.length === 0)) {
                return {
                    valid: false,
                    reason: 'no-mx-records',
                    message: 'This email domain does not appear to accept mail. Please use a different email.'
                };
            }
        }
        catch (error) {
            // Check for DNS error codes (ENOTFOUND / ENODATA = domain doesn't exist)
            const code = error != null && typeof error === 'object' && 'code' in error
                ? error.code
                : undefined;
            if (code === 'ENOTFOUND' || code === 'ENODATA') {
                return {
                    valid: false,
                    reason: 'no-mx-records',
                    message: 'This email domain does not exist. Please check your email address.'
                };
            }
            // DNS timeout or other transient error — don't block the user
            const message = error instanceof Error ? error.message : String(error);
            if (message === 'DNS timeout') {
                return {
                    valid: false,
                    reason: 'dns-error',
                    message: 'Unable to verify email domain. Please try again in a moment.'
                };
            }
            // Other DNS errors — allow through (fail open)
            return { valid: true };
        }
    }
    return { valid: true };
}
