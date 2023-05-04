const version = "0.01";

const appAssets = [
  "index.html",
  "info.html",
  "help.html",
  "app.js",
  "core/lib.js",
  "settings.json",
  "css/pwa.css",
  "icons/hpass.256.png",
  "icons/hpass.512.png",
  "icons/hpass.1024.png",
  "icons/maskable.1024.png",
];

// fetch("./settings.json")
//   .then((response) => response.json())
//   .then((json) => {
//     cache.add(json);
//     console.log("sw: install: settings in cache= ", json);
//   });

// const defaults = {
//   pepper: { value: "_", icon: "&#127798;", name: "Hot Pepper" },
//   salt: {
//     value: "top secret!",
//     icon: "&#129323;",
//     name: "Face with Finger Covering Closed Lips",
//   },
//   length: { value: 15, icon: "&#128207;", name: "Straight Ruler" },
//   email: {
//     value: "donkey@winnie.pooh",
//     icon: "&#128231;",
//     name: "E-Mail Symbol",
//   },
//   username: {
//     value: "eeore",
//     icon: "&#128100;",
//     name: "Bust In Silhouette",
//   },
// };

/*
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("v1")
      .then((cache) =>
        cache.addAll([
          "/",
          "/index.html",
          "/style.css",
          "/app.js",
          "/image-list.js",
          "/star-wars-logo.jpg",
          "/gallery/bountyHunters.jpg",
          "/gallery/myLittleVader.jpg",
          "/gallery/snowTroopers.jpg",
        ])
      )
  );
});
*/

self.addEventListener("install", (installEvent) => {
  console.log("sw: installEvent= ", installEvent);
  console.log(`sw: open: static-version= ${version}`);
  // const url = "data.json";
  // Open the Cache Storage and add the local JSON file to the cache
  // caches.open("settings").then((cache) => {
  //   console.log("sw: store settings in cache");
  //   cache.add("./settings.json");
  // });
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

// Static cache startegy - Cache with Network Fallback
const staticCache = (req) => {
  return caches.match(req).then((cachedRes) => {
    // Return cached response if found
    if (cachedRes) return cachedRes;

    // Fall back to network
    return fetch(req).then((networkRes) => {
      // Update cache with new response
      caches
        .open(`static-${version}`)
        .then((cache) => cache.put(req, networkRes));

      // Return Clone of Network Response
      return networkRes.clone();
    });
  });
};

self.addEventListener("fetch", (e) => {
  // App shell
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  }
});

self.addEventListener("load", (e) => {
  console.log("sw: load event detected: e= ", e);
});
