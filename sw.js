"use strict";
// Import Crypto-JS into your Service Worker
// importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');

// Now you can use Crypto-JS within your Service Worker
// console.log(CryptoJS); // Verify Crypto-JS is loaded

// import { getPass } from "./core/lib.js";
const version = "2024-09-15";

const appAssets = [
  "index.html",
  "edit.html",
  "info.html",
  "help.html",
  "app.js",
  "edit.js",
  "core/lib.js",
  "core/storage.js",
  "settings.json",
  "css/pwa.css",
  "css/style.css",
  "icons/logo.256.png",
  "icons/logo.512.png",
  "icons/logo.1024.png",
  "icons/back.svg",
  "icons/change.svg",
  // "icons/edit.svg", TODO: remove this line
  "icons/email.svg",
  "icons/generate.svg",
  "icons/granite.png",
  "icons/help.svg",
  "icons/info.svg",
  "icons/lock.svg",
  "icons/logo.svg",
  "icons/reload.svg",
  "icons/reset.svg",
  "icons/save.svg",
  "icons/share.svg",
  "privacy/index.html",
];

self.addEventListener("install", (installEvent) => {
  const debug = false;
  const msg = { install: true };
  const installChannel = new BroadcastChannel("installChannel");
  installChannel.postMessage(msg);
  if (debug) {
    console.log("sw: install: installChannel msg= ", msg);
    console.log("sw: install: installEvent= ", installEvent);
    console.log(`sw: install: open: static-version= ${version}`);
  }
  installEvent.waitUntil(
    caches.open(`static-${version}`).then((cache) => cache.addAll(appAssets))
  );
});

// clean old version caches on activation
self.addEventListener("activate", (e) => {
  let cleaned = caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== `static-${version}` && key.match("static-")) {
        return caches.delete(key);
      }
    });
  });
  e.waitUntil(cleaned);
});

// Static cache strategy - Network first with Cache Fallback
// const staticCache = (req) => {
//   req.respondWith(
//     fetch(req).then((networkRes) => {
//       caches
//         .open(`static-${version}`)
//         .then((cache) => cache.put(req, networkRes));
//       // Return Clone of Network Response
//       return networkRes.clone();
//     })
//   );
// };

const staticCache = (req) => {
  return fetch(req).then((networkRes) => {
    if (networkRes.ok && networkRes.status !== 206) { // Add this check
      return caches.open(`static-${version}`).then((cache) => {
        cache.put(req, networkRes.clone()); // Put a clone of the network response in the cache
        return networkRes; // Return the original network response
      });
    } else {
      return networkRes; // Return the original network response without caching
    }
  });
};


self.addEventListener("fetch", (e) => {
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  }
});

self.addEventListener("load", (e) => {
  const debug = false;
  if (debug) console.log("sw: load event detected: e= ", e);
});

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
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
          const msg = { type: "VERSION", version: version };
          if (debug) console.log("sw: message: postMessage: msg= ", msg);
          clients[0].postMessage(msg);
        }
      });
  }
});

let storedPassword = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "store-assword") {
      PASSWORD = event.data.password;
  } else if (event.data && event.data.type === "retrieve-password") {
      event.source.postMessage({
          type: "password",
          password: storedPassword,
      });
      storedPassword = null; // Clear after sending
  }
});

// // Get message with PASSWORD from app.js and send it to edit.html
// self.addEventListener('message', (event) => {
//   console.log(`sw: message: event=`, event);
//   if (event.data && event.data.type === 'getPassword') { // from app.js
//     PASSWORD = event.data.password;
//     console.log(`sw: got PASSWORD= ${PASSWORD}`);
//     self.clients.matchAll().then((clients) => {
//       console.log('sw: clients=', clients);
//       const editPage = clients.find(client => client.url.includes('edit.html'));
//       console.log(`sw: editPage= `, editPage);
//       if (editPage) {
//         const msg = { action: 'setPassword', password: PASSWORD};
//         console.log(`sw: editPage posting message= `, msg);
//         editPage.postMessage(msg);
//       }
//     });
//   }
// });

self.addEventListener('clientschange', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      console.log('Client URL:', client.url);
    });
  });
});
