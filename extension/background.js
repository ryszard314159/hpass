// import { getHint } from "./config.js";
import { getPass, MINLENGTH, MAXLENGTH } from "./lib.js";
let DOMAIN;
const DOMAINS = [];
const MAXDOMAINS = 9;
const validSenders = new Set(["content", "popup"]);

// typeof msg.hint !== "string" || msg.hint.length < 1
// ? getHint(DOMAIN) // S[0])
// : msg.hint;

function getHint(domain, hint) {
  if (typeof hint === "string" && hint.length > 0) return hint;
  let h;
  try {
    h = domain.split(".").slice(-2, -1)[0]; // "www.netflix.com" => "netflix"
  } catch {
    h = "";
  }
  return h;
}

function replaceDomain(x) {
  function show(when) {
    console.log(
      `sw: replaceDomain:${when}: x= ${x}, DOMAIN= ${DOMAIN}`,
      " DOMAINS= ",
      DOMAINS
    );
  }
  show(1);
  if (x === undefined || x.indexOf(".") < 0) return;
  if (DOMAINS.length > MAXDOMAINS) DOMAINS.pop();
  DOMAINS.unshift(x); // prepend to DOMAINS
  DOMAIN = x;
  show(2);
}

function contentHandler(msg) {
  console.log("sw: contentHandler: request= ", msg);
  console.log("sw: contentHandler: DOMAIN= ", DOMAIN);
  chrome.storage.local.get(["options"], (results) => {
    console.log("sw: contentHandler: results= ", results);
    const opts = results.options;
    opts.hint = getHint(DOMAIN, ""); // S[0]);
    const p = getPass(opts);
    // const hint = getHint(DOMAIN, "");
    // const p = getPass(hint, opts);
    console.log("sw: contentHandler: opts= ", opts);
    const response = {
      email: opts.email,
      username: opts.username,
      password: p,
      from: "sw",
    };
    console.log("sw: contentHandler: response= ", response);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // chrome.tabs.sendMessage(tabs[0].id, { email: opts.email, password: p });
      chrome.tabs.sendMessage(tabs[0].id, response);
    });
  });
}

function popupHandler(msg) {
  console.log("sw: popupHandler: DOMAIN= ", DOMAIN, " DOMAINS= ", DOMAINS);
  console.log("sw: popupHandler: request= ", msg);
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    opts.hint = getHint(DOMAIN, msg.hint);
    const p = getPass(opts);
    chrome.runtime.sendMessage({
      hint: opts.hint,
      password: p,
      domain: DOMAIN,
      minlength: MINLENGTH,
      maxlength: MAXLENGTH,
    });
  });
}

function optionsHandler(msg) {
  console.log("sw: optionsHandler: msg= ", msg);
  chrome.runtime.sendMessage({ min: MINLENGTH, max: MAXLENGTH });
}

const handlers = {
  content: contentHandler,
  popup: popupHandler,
  options: optionsHandler,
};

chrome.runtime.onMessage.addListener((msg) => {
  if (!validSenders.has(msg.from)) return;
  console.log("sw: onMessage: msg= ", msg);
  replaceDomain(msg.domain);
  handlers[msg.from](msg);
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
  // let p, opts;
  console.log("sw: onInstalled: details= ", details);
  let cfg = { MAXLENGTH: MAXLENGTH, MINLENGTH: MINLENGTH };
  chrome.storage.local.set({ config: cfg });
  console.log("sw: config saved, cfg= ", cfg);
  if (details.reason === "install") {
    console.log("sw: This is a first install!");
    chrome.runtime.openOptionsPage();
  } else if (details.reason === "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log(
      `sw: Updated from ${details.previousVersion} to ${thisVersion} !`
    );
  }
});
