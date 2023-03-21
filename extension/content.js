// Uncaught SyntaxError: Cannot use import statement outside a module
// import { copyToClipboard, getHint } from "./config.js";
// import { getPass } from "./lib.js";

// domain = "www.netflix.com" => "netflix.com"
function getHint(domain) {
  return domain.split(".").slice(-2).join(".");
}

console.log("content: START");
// chrome.storage.local.clear();
chrome.storage.local.get(["options"], (opts) => {
  console.log("contents.js: START: opts= ", opts);
});

window.onload = function () {
  console.log("content: onload: BEGIN");
  if (document.URL.split("/").slice(-1)[0] === "popup.html") {
    console.log("content: exit from popup.html");
    return;
  }
  let h = getHint(document.domain);
  alert(`content: domain= ${document.domain}, hint= ${h}`);
  console.log("content: document= ", document.domain);
  console.log("content: typeof(document.domain)= ", typeof document.domain);
  chrome.storage.local.set({ domain: document.domain });
  chrome.storage.local.set({ hint: h });
  // prettier-ignore
  chrome.storage.local.get("domain", (result) => {
    console.log(`content: after set: get domain: result.domain= ${result.domain}`);
  });
  chrome.storage.local.get("hint", (result) => {
    console.log(`content: after set: get hint: result.hint= ${result.hint}`);
  });
  let emailInput = document.querySelector('input[type="email"]');
  let passwordInput = document.querySelector('input[type="password"]');
  if (passwordInput === null && emailInput === null) {
    console.log("content: null? passwordInput= ", passwordInput);
    return;
  }
  chrome.storage.local.get(["options"], function (results) {
    let opts = results.options;
    console.log("contents: onload: chrome.storage.local.get: opts= ", opts);
    if (emailInput !== null) {
      emailInput.value = opts.email;
      // alert(`content: Email is set: ${opts.email}`);
    }
    if (passwordInput !== null) {
      import("/lib.js").then((lib) => {
        console.log("content: before getHint: document.URL= ", document.URL);
        let h = (opts.hint = getHint(document.domain)); // document.URL);
        let p = (passwordInput.value = lib.getPass(opts));
        let msg = `content: domain= ${document.domain}, hint= ${h}, password= ${p}`;
        // prettier-ignore
        navigator.clipboard.writeText(p).then(
          () =>
            console.log(`content: password >>${p}<< copied to clipboard!`),
          () =>
            console.log(`content: password >>${p}<< copy to clipboard FAILED!`)
        );
        console.log(msg);
        alert(msg);
      });
    }
  });
};

// window.localStorage.setItem("url", document.URL);
//   /*
//   chrome.storage.local.set({ key: value }).then(() => {
//   console.log("Value is set to " + value);
// });
// chrome.storage.local.get(["key"]).then((result) => {
//   console.log("Value currently is " + result.key);
// });
//   */
// chrome.runtime.sendMessage(
//   { message: "hint from content script!", hint: h },
//   function (response) {
//     console.log("content: response= ", response);
//   }
// );
// let msg = { url: document.URL, hint: getHint(), from: "content.js" };
// let msg = "content.js: MESSAGE";
// alert(`content.js: before sendMessage: msg= ${msg}`);
// chrome.runtime.sendMessage(msg, function (response) {
//   alert(`content.js: inside sendMessage: response= ${response}`);
//   console.log("content.js: inside sendMessage: response= ", response);
// });

// Uncaught TypeError: Cannot read properties of undefined (reading 'addListener')
// Check whether new version is installed
// chrome.runtime.onInstalled.addListener(function (details) {
//   if (details.reason == "install") {
//     console.log("content: This is a first install!");
//   } else if (details.reason == "update") {
//     const thisVersion = chrome.runtime.getManifest().version;
//     console.log(
//       "content: Updated from " +
//         details.previousVersion +
//         " to " +
//         thisVersion +
//         "!"
//     );
//   }
// });

/*
from chatGPT
chrome.runtime.sendMessage({message: "hello from content script!"}, function(response) {
  console.log(response);
});
*/
