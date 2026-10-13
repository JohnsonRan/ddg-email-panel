/* Minimal offline shell for DDG Email Panel. */
const CACHE = 'ddgep-v2'
const PRECACHE = ['/', '/login', '/manifest.json', '/logo.svg']

/** Production build output is content-hashed and served `immutable`; anything
 *  else (dev chunks, HTML) must never be served from the cache blindly. */
const isCacheableAsset = (response) =>
  response.ok && (response.headers.get('cache-control') || '').includes('immutable')

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Never cache API traffic or the DuckDuckGo proxy.
  if (url.pathname.startsWith('/api/')) return

  // Hashed build output: cache first, refresh the cache when the response is
  // immutable (which is only true for production builds).
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (isCacheableAsset(response)) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
      )
    )
    return
  }

  // Everything else: network first, fall back to the cached copy or the shell.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})
