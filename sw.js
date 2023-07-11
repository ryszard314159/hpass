"use strict";
// import { getPass } from "./core/lib.js";
const version = "2023-07-11";

const appAssets = [
  "index.html",
  "info.html",
  "help.html",
  "app.js",
  "core/lib.js",
  "settings.json",
  "css/pwa.css",
  "css/style.css",
  "icons/logo.256.png",
  "icons/logo.512.png",
  "icons/logo.1024.png",
  "icons/logo.svg",
  "icons/info.svg",
  "icons/help.svg",
  "icons/reset.svg",
  "icons/generate.svg",
  "icons/back.svg",
];

self.addEventListener("install", (installEvent) => {
  const msg = { install: true };
  const installChannel = new BroadcastChannel("installChannel");
  installChannel.postMessage(msg);
  console.log("sw: install: installChannel msg= ", msg);
  console.log("sw: install: installEvent= ", installEvent);
  console.log(`sw: install: open: static-version= ${version}`);
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
const staticCache = (req) => {
  req.respondWith(
    fetch(req).then((networkRes) => {
      caches
        .open(`static-${version}`)
        .then((cache) => cache.put(req, networkRes));
      // Return Clone of Network Response
      return networkRes.clone();
    })
  );
};

self.addEventListener("fetch", (e) => {
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  }
});

self.addEventListener("load", (e) => {
  console.log("sw: load event detected: e= ", e);
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
  console.log("sw: message: event= ", event);
  if (event.data && event.data.type === "GET_VERSION") {
    // Select who we want to respond
    console.log("sw: message: event.data= ", event.data);
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
          console.log("sw: message: postMessage: msg= ", msg);
          clients[0].postMessage(msg);
        }
      });
  }
});
