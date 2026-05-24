import { describe, expect, it, mock } from 'bun:test';

// Mock node:dns/promises to avoid real DNS calls
const mockResolve = mock(() =>
  Promise.resolve([{ exchange: 'mx.example.com', priority: 10 }])
);
mock.module('node:dns/promises', () => ({
  resolve: mockResolve
}));

const { validateEmailDomain } = await import('./mx-validator');

describe('validateEmailDomain', () => {
  it('rejects disposable email domains', async () => {
    const result = await validateEmailDomain('test@mailinator.com');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('disposable');
  });

  it('allows legitimate email domains', async () => {
    const result = await validateEmailDomain('user@gmail.com');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid email format', async () => {
    const result = await validateEmailDomain('notanemail');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-domain');
  });

  it('rejects non-existent domains when MX check is enabled', async () => {
    const dnsError = new Error('queryMx ENOTFOUND');
    (dnsError as NodeJS.ErrnoException).code = 'ENOTFOUND';
    mockResolve.mockImplementationOnce(() => Promise.reject(dnsError));

    const result = await validateEmailDomain(
      'test@nonexistentdomain12345xyz.com',
      { checkMx: true, dnsTimeout: 3000 }
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('no-mx-records');
  });

  it('allows domains with valid MX records when check is enabled', async () => {
    mockResolve.mockImplementationOnce(() =>
      Promise.resolve([
        { exchange: 'alt1.gmail-smtp-in.l.google.com', priority: 5 }
      ])
    );

    const result = await validateEmailDomain('user@gmail.com', {
      checkMx: true,
      dnsTimeout: 5000
    });
    expect(result.valid).toBe(true);
  });

  it('skips MX check by default', async () => {
    // A domain without MX records should still pass if MX check is disabled
    const result = await validateEmailDomain('user@example.com');
    expect(result.valid).toBe(true);
  });

  it('returns dns-error on timeout', async () => {
    mockResolve.mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DNS timeout')), 10)
        )
    );

    const result = await validateEmailDomain('user@slow-domain.com', {
      checkMx: true,
      dnsTimeout: 5
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('dns-error');
  });

  it('fails open on unknown DNS errors', async () => {
    mockResolve.mockImplementationOnce(() =>
      Promise.reject(new Error('SERVFAIL'))
    );

    const result = await validateEmailDomain('user@flaky-dns.com', {
      checkMx: true
    });
    expect(result.valid).toBe(true);
  });
});
