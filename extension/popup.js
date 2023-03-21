import { copyToClipboard, default_opts, optsKeys, getHint } from "./config.js";
import { getPass } from "./lib.js";

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
  chrome.storage.local.get(["domain"], (results) => {
    // el.hint.value = `domain= ${results.domain}`;
    el.hint.value = getHint(results.domain);
    console.log(`popup: setElements: results.domain= ${results.domain}`);
  });
  chrome.storage.local.get(["hint"], (results) => {
    // el.hint.value = `domain= ${results.domain}`;
    el.hint.value = results.hint;
    console.log(`popup: setElements: results.hint= ${results.hint}`);
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

console.log("popup: START...");

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
  // import("/lib.js").then((module) => {
  opts.hint = document.getElementById("hint").value;
  let p = (document.getElementById("password").value = getPass(opts));
  console.log(`popup: password= ${p}`);
  copyToClipboard(p);
  alert(`popup: Password is set: ${p}`);
  // });
});
