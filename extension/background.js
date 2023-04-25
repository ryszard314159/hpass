import { getPass, MINLENGTH, MAXLENGTH } from "./lib.js";
let DOMAIN;
// const DOMAINS = [];
// const MAXDOMAINS = 9;
const validSenders = new Set(["content", "popup"]);

function getHint(domain, hint) {
  // if the input hint is a non-empty string just return it
  if (typeof hint === "string" && hint.length > 0) return hint;
  // otherwise extract it from the domain string ...
  let h;
  try {
    h = domain.split(".").slice(-2, -1)[0]; // "www.netflix.com" => "netflix"
  } catch {
    h = "";
  }
  return h; // ...and return it
}

function contentHandler(msg) {
  console.log("sw: contentHandler: request= ", msg);
  console.log("sw: contentHandler: DOMAIN= ", DOMAIN);
  chrome.storage.local.get(["options"], (results) => {
    console.log("sw: contentHandler: results= ", results);
    const opts = results.options;
    opts.hint = getHint(DOMAIN, "");
    const p = getPass(opts);
    console.log("sw: contentHandler: opts= ", opts);
    const response = {
      email: opts.email,
      username: opts.username,
      password: p,
      from: "sw",
    };
    console.log("sw: contentHandler: response= ", response);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, response);
    });
  });
}

function popupHandler(msg) {
  console.log("sw: popupHandler: DOMAIN= ", DOMAIN); // " DOMAINS= ", DOMAINS);
  console.log("sw: popupHandler: msg= ", msg);
  chrome.storage.local.get(["options"], (results) => {
    const opts = results.options;
    console.log("sw: popupHandler: opts= ", opts);
    opts.hint = getHint(DOMAIN, msg.hint);
    const p = getPass(opts);
    console.log("sw: popupHandler: opts= ", opts);
    const msgForPopup = {
      hint: opts.hint,
      password: p,
      domain: DOMAIN,
      minlength: MINLENGTH,
      maxlength: MAXLENGTH,
    };
    console.log("sw: popupHandler: msgForPopup= ", msgForPopup);
    chrome.runtime.sendMessage(msgForPopup);
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
  console.log("sw: onMessage:1: msg= ", msg);
  if (!validSenders.has(msg.from)) return;
  console.log("sw: onMessage:2: msg= ", msg, " DOMAIN= ", DOMAIN);
  // replace DOMAIN with msg.domain if it is defined
  DOMAIN = msg.domain || DOMAIN;
  console.log("sw: onMessage:3: msg= ", msg, " DOMAIN= ", DOMAIN);
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

// chrome.runtime.onInstalled.addListener(function() {
//   chrome.storage.sync.get("options", function(data) {
//     if (!data.options) {
//       // If options haven't been set yet, open a new tab to your options page
//       chrome.tabs.create({ url: "options.html" });
//     }
//   });
// });

chrome.runtime.onInstalled.addListener(function () {
  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(now.getDate() + 30);

  chrome.storage.local.set({
    isFreeTrial: true,
    expiryDate: expiryDate,
  });
});
