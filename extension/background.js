import { default_opts, getHint } from "./config.js";
import { getPass } from "./lib.js";

let DOMAIN, HINT; // store values obtained from content script

// chrome.runtime.onMessage.addListener((request, sender, response) => {
chrome.runtime.onMessage.addListener((request) => {
  if (request.from !== "content") return;
  DOMAIN = request.domain;
  HINT = getHint(DOMAIN);
  console.log("sw: from content: request= ", request);
  console.log(`sw: from content: DOMAIN= ${DOMAIN}, HINT= ${HINT}`);
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    opts.hint = HINT;
    const p = getPass(opts);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { email: opts.email, password: p });
    });
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.from !== "popup") return;
  console.log("sw: from popup: request= ", request);
  if (request.hint === "") {
    HINT = getHint(DOMAIN);
    console.log(`sw: HINT= ${HINT} set from DOMAIN= ${DOMAIN}`);
  } else {
    HINT = request.hint;
    console.log(`sw: HINT= ${HINT} set from request`);
  }
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    opts.hint = HINT;
    const p = getPass(opts);
    console.log(`sw: from popup: pasword= ${p}`);
    chrome.runtime.sendMessage({ hint: HINT, password: p });
  });
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
  let p, opts;
  if (details.reason === "install") {
    console.log("background: This is a first install!");
    chrome.storage.local.set({ options: default_opts });
    console.log("background: default options stored", default_opts);
    opts = default_opts;
    p = getPass(opts);
  } else if (details.reason === "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log(
      `background: Updated from ${details.previousVersion} to ${thisVersion} !`
    );
    chrome.storage.local.get(["options"], function (results) {
      opts = results.options;
      p = getPass(opts);
    });
    console.log(`background: on ${details.reason}: opts= `, opts);
    console.log(`background: on ${details.reason}: password= `, p);
  }
});
