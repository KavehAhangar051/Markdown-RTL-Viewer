/**
 * @file public/sw.js
 * @description Offline-first Service Worker for RTL Markdown Studio PWA.
 * Implements Network-First for document navigations and Cache-First for static bundles, fonts, and icons.
 */

const SHELL_CACHE_NAME = 'rtl-studio-shell-v2.3.5';
const ASSET_CACHE_NAME = 'rtl-studio-assets-v2.3.5';

const PRECACHE_ASSETS = [
  '',
  'manifest.webmanifest',
  'icon.svg',
  'icon-32.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'apple-icon.png',
  'favicon.ico',
];

/**
 * Resolves a relative path against the Service Worker registration scope.
 * Works on both root (`/`) and GitHub Pages subpath (`/Markdown-RTL-Viewer/`).
 *
 * @param {string} relativePath - Asset path relative to scope root.
 * @returns {string} Pathname starting with `/`.
 */
function resolveScopeUrl(relativePath = '') {
  const scopePathname = new URL(self.registration.scope).pathname;
  const normalizedScope = scopePathname.endsWith('/')
    ? scopePathname
    : `${scopePathname}/`;
  return `${normalizedScope}${relativePath.replace(/^\//, '')}`;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(new Request(resolveScopeUrl(asset), { cache: 'reload' }))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== SHELL_CACHE_NAME && key !== ASSET_CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Determines whether a same-origin URL represents a static asset
 * that should be cached for offline fallback.
 *
 * @param {URL} url - Request URL object.
 * @returns {boolean} True if static asset.
 */
function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.includes('/_next/static/') ||
    path.includes('/_next/image') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.woff2') ||
    path.endsWith('.woff') ||
    path.endsWith('.ttf') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.jpg') ||
    path.endsWith('.webmanifest')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignore Next.js HMR / development websocket or internal endpoints
  if (
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('/__nextjs')
  ) {
    return;
  }

  const rootUrl = resolveScopeUrl('');

  // 1. Navigation requests: Network-First with Offline App Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(request, copy);
              cache.put(rootUrl, copy.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          const cachedRoot = await caches.match(rootUrl);
          if (cachedRoot) {
            return cachedRoot;
          }
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Static assets (JS chunks, CSS, Fonts, Images): Network-First with Offline Cache Fallback
  if (isStaticAsset(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(ASSET_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match(rootUrl);
        })
    );
    return;
  }

  // 3. Default Next.js RSC / other same-origin GET requests: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(ASSET_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
