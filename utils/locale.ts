/**
 * Next.js detects the locale from the `NEXT_LOCALE` cookie, but only for the
 * root path — `/vault` without a prefix always falls back to `defaultLocale`.
 * Writing the cookie on switch keeps the root entry point (`/`, and the PWA
 * start_url) in the language the user picked.
 */
export function rememberLocale(locale: string) {
  if (typeof document === 'undefined') return
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
}
