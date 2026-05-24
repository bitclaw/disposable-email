# @bitclaw/disposable-email

Email validation against disposable/temporary email providers with optional DNS MX record checking.

## Features

- **Disposable domain blocklist** — ~680 known disposable email providers (hardcoded, zero network calls)
- **MX record validation** — Optional DNS lookup to verify the domain can receive mail
- **Fail-open DNS** — Transient DNS errors allow the request through (only blocks definitive failures)
- **Zero dependencies** — Uses Node.js built-in `dns/promises`

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

DISPOSABLE_DOMAINS.has('tempmail.com')  // true
DISPOSABLE_DOMAINS.size                 // ~680
```

## DNS Error Handling

| DNS Result | Behavior |
|-----------|----------|
| MX records found | `{ valid: true }` |
| ENOTFOUND / ENODATA | `{ valid: false, reason: 'no-mx-records' }` |
| Timeout | `{ valid: false, reason: 'dns-error' }` |
| Other DNS error | `{ valid: true }` (fail-open) |

## Testing

```bash
bun test
```

13 tests across 2 files.
