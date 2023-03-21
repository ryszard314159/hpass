import { default_opts } from "./config.js";

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    console.log("background: This is a first install!");
    chrome.storage.local.set({ options: default_opts });
    console.log("background: default options stored", default_opts);
  } else if (details.reason === "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log(
      `background: Updated from ${details.previousVersion} to ${thisVersion} !`
    );
  }
});
