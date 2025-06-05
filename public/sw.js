const CACHE_NAME = 'word-guesser-fun-v1.3'; // Increment version for updates

// IMPORTANT: If your Vite 'base' config is, e.g., '/WORD-GUESSER-FUN/',
// then your assets will be served from that base path.
// The service worker itself will be at '/WORD-GUESSER-FUN/sw.js'.
// The '/' in urlsToCache refers to the root of the deployment, 
// which after 'base' config effectively becomes '/WORD-GUESSER-FUN/'.

const REPO_BASE_PATH = '/WORD-GUESSER-FUN'; // Match this with your vite.config.ts base

const ESSENTIAL_ASSETS_TO_CACHE = [
  `${REPO_BASE_PATH}/`, // Alias for index.html at the base
  `${REPO_BASE_PATH}/index.html`,
  `${REPO_BASE_PATH}/manifest.json`,
  // Icons are also relative to the base
  `${REPO_BASE_PATH}/icons/icon-192x192.png`,
  `${REPO_BASE_PATH}/icons/icon-512x512.png`,
  // External CDN assets (these are absolute URLs, so no REPO_BASE_PATH needed)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;500;600;700&display=swap',
  // Default sound URLs (absolute URLs)
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/GAME%20SETUP.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/GAME%20MUSIC.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/CORRECT%20SOUND.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/SKIP%20SOUND.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/TIME%27S%20UP.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/RESULT.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/START.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/TRY%20AGAIN.wav',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/3-2-1%20Go.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Power-Up%20Collected%20Sound.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Time%20Freeze%20Sound.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Skip%20Freebie%20Used%20Sound.mp3',
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Points%20Doubler%20Applied%20Sound.mp3'
  // Vite's hashed assets (e.g., /WORD-GUESSER-FUN/assets/index-XXXX.js) will be cached by the fetch handler.
  // The service worker file itself (sw.js) is usually not explicitly cached in this list as it's controlling the cache.
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install. Current scope:', self.registration.scope);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching essential assets:', ESSENTIAL_ASSETS_TO_CACHE);
        const validUrlsToCache = ESSENTIAL_ASSETS_TO_CACHE.filter(url => url && typeof url === 'string');
        return cache.addAll(validUrlsToCache).catch(error => {
          console.error('[ServiceWorker] Failed to cache one or more essential URLs during install:', error, validUrlsToCache);
        });
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to open cache for essential assets:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('[ServiceWorker] Returning from cache:', event.request.url);
          return cachedResponse;
        }

        // console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response and it's an HTTP/HTTPS URL
            if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  // console.log('[ServiceWorker] Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.warn('[ServiceWorker] Fetch failed for:', event.request.url, error);
          // For navigation requests, you might want to return the cached index.html
          // This helps if the user tries to navigate to a deep link while offline,
          // and the app shell can handle routing.
          if (event.request.mode === 'navigate') {
            console.log('[ServiceWorker] Navigation fetch failed, trying to return cached base index.html');
            return caches.match(`${REPO_BASE_PATH}/index.html`);
          }
        });
      })
  );
});
