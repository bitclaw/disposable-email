/**
 * Backend mail servers for services that assign rotating/random alias domains
 * (e.g. 10minutemail.com hands out `vtmpj.net`, `xyzab.net`, etc., all routed
 * through the same MX host). A domain-name blocklist can never enumerate every
 * rotating alias; the MX host is the stable ground truth for these services.
 *
 * Every entry here was confirmed via a live `dig MX` lookup to be dedicated
 * infrastructure for the disposable-mail service itself. Do NOT add a host
 * shared with a real mail provider (e.g. a service that routes through
 * mx.yandex.net or protonmail.ch's MX), that blocks legitimate users of the
 * underlying provider, not just the disposable service.
 */
export const DISPOSABLE_MX_HOSTS: ReadonlySet<string> = new Set([
  'prd-smtp.10minutemail.com',
  'mail.guerrillamail.com',
  'mail.mailinator.com',
  'mail2.mailinator.com',
  'smtp.yopmail.com',
  'mx.discard.email',
  'mail1.trashymail.com',
  'mail2.trashymail.com',
  'mx.dropmail.me',
  'mintserver.mintemail.com',
  'mail.getnada.com',
  'mail.burnermail.io'
]);
