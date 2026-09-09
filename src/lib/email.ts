/** Webmail inboxes we can deep-link into, by email domain. */
const WEBMAIL_PROVIDERS: Record<string, { name: string; url: string }> = {
  'gmail.com': { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/from:Mina' },
  'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/from:Mina' },
  'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  'live.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  'msn.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'ymail.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'me.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'proton.me': { name: 'Proton Mail', url: 'https://mail.proton.me' },
  'protonmail.com': { name: 'Proton Mail', url: 'https://mail.proton.me' },
  'aol.com': { name: 'AOL Mail', url: 'https://mail.aol.com' },
  'gmx.com': { name: 'GMX', url: 'https://www.gmx.com/mail' },
  'zoho.com': { name: 'Zoho Mail', url: 'https://mail.zoho.com' },
  'yandex.com': { name: 'Yandex Mail', url: 'https://mail.yandex.com' },
}

/**
 * Deliberately loose: the address is confirmed by whether the link arrives, so
 * this only needs to catch obvious typos before we call Supabase.
 */
export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim())
}

/**
 * The webmail to offer after sending the link. Unrecognised domains (company
 * mail, self-hosted) get no deep link — there is nowhere reliable to send them.
 */
export function webmailFor(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1]
  return domain ? WEBMAIL_PROVIDERS[domain] : undefined
}
