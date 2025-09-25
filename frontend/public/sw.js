// FILE: public/sw.js
const CACHE_NAME = 'plantcare-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/plants',
  '/notifications',
  '/profile',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers l'API backend
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Ignorer les requêtes Chrome extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retourner la réponse en cache si elle existe
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then((response) => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();

            // Mettre en cache les ressources statiques
            if (event.request.url.match(/\.(js|css|html|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('Service Worker: Caching new resource', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // Retourner une page offline basique pour les pages HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>PlantCare - Hors ligne</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: system-ui, -apple-system, sans-serif; 
                      text-align: center; 
                      padding: 2rem; 
                      background: #f9fafb; 
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      background: white; 
                      padding: 2rem; 
                      border-radius: 8px; 
                      box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                    }
                    h1 { color: #16a34a; margin-bottom: 1rem; }
                    p { color: #6b7280; line-height: 1.5; }
                    button { 
                      background: #16a34a; 
                      color: white; 
                      border: none; 
                      padding: 0.75rem 1.5rem; 
                      border-radius: 6px; 
                      cursor: pointer; 
                      margin-top: 1rem;
                    }
                    button:hover { background: #15803d; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>🌱 PlantCare</h1>
                    <p>Vous êtes actuellement hors ligne. Vérifiez votre connexion internet et réessayez.</p>
                    <button onclick="window.location.reload()">Réessayer</button>
                  </div>
                </body>
                </html>
                `,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            throw error;
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});