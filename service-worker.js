'use strict';

const CACHE_NAME = 'meethalf-v1';

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

// ── Activate: delete stale caches from previous versions ─────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
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

  // Cache-first for local assets — update cache in background after serving.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
