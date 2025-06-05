const CACHE_NAME = 'word-guesser-fun-v1.1'; // Increment version for updates
const urlsToCache = [
  '/',
  '/index.html',
  // Game logic files (paths relative to root)
  '/index.tsx',
  '/App.tsx',
  '/components/SetupScreen.tsx',
  '/components/GameScreen.tsx',
  '/components/ResultsScreen.tsx',
  '/components/BackgroundMusicPlayer.tsx',
  '/components/FileUploadButton.tsx',
  '/types.ts',
  '/constants.ts',
  // Icons (assuming they are in /icons/ folder at root)
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // External Assets
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;500;600;700&display=swap',
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0/', // Note: importmap might resolve these to more specific URLs
  // Default sound URLs from constants.ts
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
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        const validUrlsToCache = urlsToCache.filter(url => url && typeof url === 'string');
        // Using addAll which will fail if any single request fails.
        // For production, consider caching critical assets first, then non-critical ones.
        return cache.addAll(validUrlsToCache).catch(error => {
          console.error('[ServiceWorker] Failed to cache one or more URLs during install:', error);
          // Optionally, re-throw to make the install fail, or handle more gracefully.
          // throw error; 
        });
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to open cache or cache.addAll failed:', error);
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

  // Strategy: Cache first, then network.
  // For dynamic content or API calls, you might use a network-first strategy.
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
            // Check if we received a valid response
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
          console.warn('[ServiceWorker] Fetch failed; returning offline page or error for:', event.request.url, error);
          // Optionally, return a generic offline fallback page:
          // return caches.match('/offline.html'); 
          // Or, if it's an image or specific asset type, a placeholder.
        });
      })
  );
});
