export type EmailValidationResult = {
  valid: boolean;
  reason?: 'disposable' | 'no-mx-records' | 'invalid-domain' | 'dns-error';
  message?: string;
};

export type MxValidationOptions = {
  /** Check DNS MX records for the domain. Adds latency (~100-500ms). Default: false */
  checkMx?: boolean;
  /** Timeout for DNS lookups in milliseconds. Default: 5000 */
  dnsTimeout?: number;
};
