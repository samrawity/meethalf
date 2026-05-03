'use strict';

// ── DEPLOY INSTRUCTION ────────────────────────────────────────
// Increment CACHE_VERSION by 1 on every deploy that changes any
// cached file (app.js, style.css, index.html, config.js, icons).
// This is the one manual step required — without it, users keep
// serving the old cache indefinitely.
// ─────────────────────────────────────────────────────────────
const CACHE_VERSION = 3;
const CACHE_NAME    = `amichemin-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/config.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Hostnames that always go network-first (APIs, Firebase, third-party scripts).
const NETWORK_FIRST_HOSTS = [
  'overpass-api.de',
  'overpass.kumi.systems',
  'lz4.overpass-api.de',
  'nominatim.openstreetmap.org',
  'firebasedatabase.app',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'sentry-cdn.com',
  'contentsquare.net',
];

// ── Install: pre-cache static shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: delete every cache that isn't the current version
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => (k.startsWith('meethalf-') || k.startsWith('amichemin-')) && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for all API/external calls — fall back to cache if offline.
  if (NETWORK_FIRST_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-while-revalidate for static assets:
  // serve the cached version immediately (fast), then fetch a fresh copy
  // in the background and update the cache — so users get new files on
  // the next visit without ever needing a hard refresh.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);

        return cached || networkFetch;
      })
    )
  );
});
