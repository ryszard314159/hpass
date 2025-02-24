"use strict";

import { VERSION } from "./config.js";

const appAssets = [
  "config.js",
  "index.html",
  "info.html",
  "help.html",
  "app.js",
  "webauthn.js",
  "core/lib.js",
  "settings.json",
  "css/pwa.css",
  "icons/back.svg",
  "icons/change.svg",
  "icons/email.svg",
  "icons/generate.svg",
  "icons/right-generate.svg",
  "icons/help.svg",
  "icons/info.svg",
  "icons/install.svg",
  "icons/lock.svg",
  "icons/logo.svg",
  "icons/reload.svg",
  "icons/reset.svg",
  "icons/save.svg",
  "icons/share.svg",
  "privacy/index.html",
];

self.addEventListener("install", (installEvent) => {
  const msg = { install: true };
  const installChannel = new BroadcastChannel("installChannel");
  
  installEvent.waitUntil(
    Promise.all([
      // Broadcast the installation message
      installChannel.postMessage(msg),
      
      // Cache all app assets
      caches.open(`static-${VERSION}`)
        .then(cache => cache.addAll(appAssets))
        .catch(error => {
          console.error('Failed to cache assets:', error);
          throw error; // Re-throw to indicate installation failure
        }),
      self.skipWaiting()
    ])
    .then(() => {
      console.log('Installation completed successfully');
    })
    .catch(error => {
      console.error('Installation failed:', error);
      // Optionally, you could do additional error handling here
    })
    .finally(() => {
      installChannel.close(); // Close the channel after use
    })
  );
});

self.addEventListener("activate", (event) => {
  const cleaned = caches.keys().then((keys) => {
    return Promise.all(
      keys.map((key) => {
        if (key !== `static-${VERSION}` && key.startsWith("static-")) {
          return caches.delete(key); // Delete old cache
        }
      })
    );
  });

  event.waitUntil(
    Promise.all([
      cleaned, // Clean up old caches
      self.clients.claim() // Take control of all clients immediately
    ])
  );
});

async function staticCache(req) {
  try {
    // Try fetching the resource from the network
    const networkRes = await fetch(req);
    // If the response is valid and not a partial response (status !== 206), cache it
    if (networkRes.ok && networkRes.status !== 206) {
      const cache = await caches.open(`static-${VERSION}`);
      await cache.put(req, networkRes.clone()); // Cache the cloned response
    }
    // Return the network response (cached or not)
    return networkRes;
  } catch (error) {
    console.warn('Fetch request failed, falling back to cache:', error);
    // If the fetch fails (e.g., offline), try retrieving the resource from the cache
    const cache = await caches.open(`static-${VERSION}`);
    const cachedRes = await cache.match(req);
    if (cachedRes) {
      return cachedRes; // Return the cached response if available
    }
    // If no cached response is found, throw an error or handle it gracefully
    return new Response('Offline and resource not found in cache', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

self.addEventListener("fetch", (e) => {
  // Only handle requests within the same origin as your app
  if (e.request.url.startsWith(location.origin)) {
    e.respondWith(staticCache(e.request));
  }
});

self.addEventListener("load", (e) => {
  const debug = false;
  if (debug) console.log("sw: load event detected: e= ", e);
});

// service-worker.js
// Listen to the request
self.addEventListener("message", (event) => {
  const debug = false;
  if (debug) console.log("sw: message: event= ", event);
  if (event.data && event.data.type === "GET_VERSION") {
    // Select who we want to respond
    if (debug) console.log("sw: message: event.data= ", event.data);
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: "window",
      })
      .then((clients) => {
        if (clients && clients.length) {
          // Send a response - the clients
          // array is ordered by last focused
          const msg = { type: "VERSION", VERSION: VERSION };
          if (debug) console.log("sw: message: postMessage: msg= ", msg);
          clients[0].postMessage(msg);
        }
      });
  }
});

let storedPassword = null;
self.addEventListener("message", (event) => {
  event.waitUntil((async () => {
    if (event.data && event.data.type === "store-password") {
        storedPassword = event.data.password;
        const tag = event.data.password;
    } else if (event.data && event.data.type === "retrieve-password") {
        event.source.postMessage({type: "password", password: storedPassword});
    }
  })());
});
