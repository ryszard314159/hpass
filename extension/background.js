// import { getHint } from "./config.js";
import { getPass } from "./lib.js";
const DOMAINS = [];
const MAXDOMAINS = 9;
const validSenders = new Set(["content", "popup"]);

function getHint(domain) {
  let h;
  try {
    h = domain.split(".").slice(-2, -1)[0]; // "www.netflix.com" => "netflix"
  } catch {
    h = "";
  }
  return h;
}

function addDomain(x) {
  console.log("sw: addDomain: domain= ", x);
  if (x === undefined || x.indexOf(".") < 0) return;
  if (DOMAINS.length > MAXDOMAINS) DOMAINS.pop();
  if (DOMAINS.indexOf(x) < 0) DOMAINS.unshift(x); // prepend to DOMAINS
}

// chrome.runtime.onMessage.addListener((request, sender, response) => {
function contentHandler(msg) {
  console.log("sw: contentHandler: request= ", msg);
  console.log("sw: contentHandler: DOMAINS= ", DOMAINS);
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    opts.hint = getHint(DOMAINS[0]);
    const p = getPass(opts);
    const response = { email: opts.email, password: p, from: "sw" };
    console.log("sw: contentHandler: response= ", response);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { email: opts.email, password: p });
    });
  });
}

function popupHandler(msg) {
  console.log("sw: popupHandler: DOMAINS= ", DOMAINS);
  console.log("sw: popupHandler: request= ", msg);
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    opts.hint =
      typeof msg.hint !== "string" || msg.hint.length < 1
        ? getHint(DOMAINS[0])
        : msg.hint;
    const p = getPass(opts);
    chrome.runtime.sendMessage({ hint: opts.hint, password: p });
  });
}

const handlers = { content: contentHandler, popup: popupHandler };

chrome.runtime.onMessage.addListener((msg) => {
  if (!validSenders.has(msg.from)) return;
  console.log("sw: msg= ", msg);
  addDomain(msg.domain);
  handlers[msg.from](msg);
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
  // let p, opts;
  if (details.reason === "install") {
    console.log("sw: This is a first install!");
  } else if (details.reason === "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log(
      `sw: Updated from ${details.previousVersion} to ${thisVersion} !`
    );
  }
});
