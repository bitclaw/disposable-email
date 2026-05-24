import type { EmailValidationResult, MxValidationOptions } from './types';
/**
 * Validate an email domain against the disposable blocklist and optionally
 * check DNS MX records to verify the domain can receive mail.
 *
 * @param email - Email address to validate
 * @param opts - Validation options (MX check, DNS timeout)
 * @returns Validation result with reason if invalid
 */
export declare function validateEmailDomain(email: string, opts?: MxValidationOptions): Promise<EmailValidationResult>;
//# sourceMappingURL=mx-validator.d.ts.map