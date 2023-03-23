// import { copyToClipboard, default_opts, optsKeys, getHint } from "./config.js";
import { default_opts, optsKeys } from "./config.js";
// import { getPass } from "./lib.js";

const el = {};
const opts = {};
optsKeys.forEach((k) => {
  opts[k] = default_opts[k];
  el[k] = document.getElementById(k); // select popup.html web elements
});
el.hint = document.getElementById("hint");
el.password = document.getElementById("password");

function setElements() {
  chrome.storage.local.get(["options"], (results) => {
    console.log("popup: setElements: local.get: opts= ", opts);
    console.log(`popup: setElements: results.options= ${results.options}`);
    optsKeys.forEach((k) => (el[k].value = opts[k] = results.options[k]));
  });
}

function onOpened() {
  console.log(`popup: Options page opened`);
  setElements();
}
function onError(error) {
  console.log(`Error: ${error}`);
}
chrome.runtime.openOptionsPage().then(onOpened, onError);

document.getElementById("save").addEventListener("click", () => {
  Object.keys(opts).forEach((x) => {
    opts[x] = document.getElementById(x).value;
  });
  chrome.storage.local.set({ options: opts });
});

document.getElementById("reset").addEventListener("click", () => {
  Object.keys(opts).forEach((key) => {
    opts[key] = document.getElementById(key).value = default_opts[key];
    console.log(`popup: reset: opts[${key}]= ${opts[key]}$`);
  });
  chrome.storage.local.set({ options: opts });
  console.log(`popup: reset: opts= ${opts}$`);
  alert(`popup: reset: opts= ${opts}$`);
});

document.getElementById("generate").addEventListener("click", () => {
  const msg = { from: "popup", hint: el.hint.value };
  console.log("popup: sending message to service worker: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((request) => {
    console.log(`popup: password= ${request.password}, hint= ${request.hint}`);
    let p = (el.password.value = request.password);
    el.hint.value = request.hint;
    console.log(`popup: password= ${p}`);
    navigator.clipboard.writeText(p);
  });
});
