# @bitclaw/disposable-email

Email validation against disposable/temporary email providers with optional DNS MX record checking.

## Features

- **Disposable domain blocklist** - ~8,200 known disposable email providers, generated from a
  maintained community source (zero network calls to check)
- **MX host detection** - Optional check that catches rotating-alias domains (services like
  10minutemail.com that assign a fresh random domain per inbox) by matching the backend mail
  server instead of the domain name
- **MX record validation** - Optional DNS lookup to verify the domain can receive mail
- **Fail-open DNS** - Transient DNS errors allow the request through (only blocks definitive failures)
- **Zero dependencies** - Uses Node.js built-in `dns/promises`

### Why two blocklists: domain names vs. MX hosts

A domain blocklist only catches services a scraper has already discovered. It can never catch a
*rotating-alias* service, where every signup gets a new, previously-unseen domain (e.g.
`10minutemail.com` handed out `vtmpj.net` for one inbox). Those domains aren't predictable, so no
static list, however well maintained, can enumerate them in advance.

What *is* stable is the backend infrastructure: rotating-alias services still route all that mail
through the same small set of MX servers, because standing up new mail infrastructure is
expensive while registering a new domain is nearly free. `DISPOSABLE_MX_HOSTS` in `src/mx-hosts.ts`
matches on that instead. It's checked only when `checkMx: true` is passed to `validateEmailDomain`,
since it requires a live DNS lookup.

**Every entry in `DISPOSABLE_MX_HOSTS` was verified with a live `dig MX <domain>` lookup before
being added, and hosts shared with real mail providers are deliberately excluded.** Some
temp-mail-flavored domains actually route through general-purpose providers (e.g. `mx.yandex.net`,
`protonmail.ch`) - blocking those would false-positive real users of that provider, not just the
disposable service. Don't add a speculative or unverified hostname to this list; verify it's
dedicated infrastructure for the disposable service first.

## Installation

```bash
bun add @bitclaw/disposable-email
```

## Quick Start

```typescript
import { isDisposableEmail, validateEmailDomain } from '@bitclaw/disposable-email'

// Fast synchronous check against blocklist
isDisposableEmail('user@tempmail.com')  // true
isDisposableEmail('user@gmail.com')     // false

// Full validation with optional MX check
const result = await validateEmailDomain('user@example.com', { checkMx: true })
if (!result.valid) {
  console.log(result.reason, result.message)
}
```

## API

### `isDisposableEmail(email: string): boolean`

Synchronous check against the built-in blocklist. Returns `true` if the domain is a known disposable email provider.

```typescript
isDisposableEmail('user@guerrillamail.com')  // true
isDisposableEmail('user@company.com')        // false
```

### `validateEmailDomain(email, options?): Promise<EmailValidationResult>`

Full domain validation pipeline:

1. Extracts and validates the domain from the email
2. Checks against the disposable domain blocklist
3. Optionally verifies DNS MX records

```typescript
const result = await validateEmailDomain('user@fake-domain.xyz', {
  checkMx: true,     // Enable MX record lookup (default: false)
  dnsTimeout: 5000   // DNS timeout in ms (default: 5000)
})

if (!result.valid) {
  // result.reason: 'disposable' | 'no-mx-records' | 'invalid-domain' | 'dns-error'
  // result.message: Human-readable explanation
}
```

### Types

```typescript
type EmailValidationResult = {
  valid: boolean
  reason?: 'disposable' | 'no-mx-records' | 'invalid-domain' | 'dns-error'
  message?: string
}

type MxValidationOptions = {
  checkMx?: boolean     // Default: false
  dnsTimeout?: number   // Default: 5000
}
```

### `DISPOSABLE_DOMAINS: Set<string>`

The raw domain blocklist, exported for direct access if needed:

```typescript
import { DISPOSABLE_DOMAINS } from '@bitclaw/disposable-email'

DISPOSABLE_DOMAINS.has('mailinator.com')  // true
DISPOSABLE_DOMAINS.size                   // ~8,200
```

Regenerated from the [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains)
community CC0 blocklist via `bun scripts/sync-domains.ts`. Run it periodically (or wire into CI)
to pick up newly discovered domains; it overwrites `src/domains.ts`.

### `DISPOSABLE_MX_HOSTS: ReadonlySet<string>`

Curated set of MX hostnames belonging to rotating-alias disposable-mail services, exported for
direct access:

```typescript
import { DISPOSABLE_MX_HOSTS } from '@bitclaw/disposable-email'

DISPOSABLE_MX_HOSTS.has('prd-smtp.10minutemail.com')  // true
```

This list is hand-curated, not scraped, precisely because each entry needs to be verified as
dedicated infrastructure (see "Why two blocklists" above) before it's safe to block on.

## DNS Error Handling

| DNS Result | Behavior |
|-----------|----------|
| MX records found, host not in `DISPOSABLE_MX_HOSTS` | `{ valid: true }` |
| MX records found, host in `DISPOSABLE_MX_HOSTS` | `{ valid: false, reason: 'disposable' }` |
| ENOTFOUND / ENODATA | `{ valid: false, reason: 'no-mx-records' }` |
| Timeout | `{ valid: false, reason: 'dns-error' }` |
| Other DNS error | `{ valid: true }` (fail-open) |

## Design note: why `isDisposableEmail` never does a DNS lookup

`isDisposableEmail` is synchronous and network-free by design, so callers can use it as an
unconditional gate (e.g. on every OTP send) without adding an external DNS round-trip to the
critical path of login/signup. The MX-host check needs a live DNS lookup, so it only lives in
`validateEmailDomain`'s opt-in `checkMx` path. If you need rotating-alias detection on every
request, call `validateEmailDomain(email, { checkMx: true })` there deliberately, understanding
you're accepting DNS latency and the fail-open behavior above.

## Testing

```bash
bun test
```

15 tests across 2 files.
