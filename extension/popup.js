import { default_opts, optsKeys } from "./config.js";

const el = {};
const opts = {};
optsKeys.forEach((k) => {
  opts[k] = default_opts[k];
  el[k] = document.getElementById(k); // select popup.html web elements
});
// add other elements from popup page...
["hint", "password", "generate", "reset", "save"].forEach((k) => {
  el[k] = document.getElementById(k);
});

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
  getPassAndHint();
}

function onError(error) {
  console.log(`Error: ${error}`);
}
chrome.runtime.openOptionsPage().then(onOpened, onError);

// save options in local storage
el.save.addEventListener("click", () => {
  Object.keys(opts).forEach((x) => {
    opts[x] = el[x].value;
  });
  chrome.storage.local.set({ options: opts });
});

// reset default options
el.reset.addEventListener("click", () => {
  Object.keys(opts).forEach((key) => {
    opts[key] = el[key].value = default_opts[key];
    console.log(`popup: reset: opts[${key}]= ${opts[key]}$`);
  });
  chrome.storage.local.set({ options: opts });
  console.log(`popup: reset: opts= ${opts}$`);
  alert(`popup: reset: opts= ${opts}$`);
});

function getPassAndHint() {
  const msg = { from: "popup", hint: el.hint.value };
  console.log(
    "popup: getPassAndHint: sending message to service worker: msg= ",
    msg
  );
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((reply) => {
    let x = `popup: getPassAndHint: password= ${reply.password}, hint= ${reply.hint}`;
    console.log(x);
    let p = (el.password.value = reply.password);
    el.hint.value = reply.hint;
    console.log(`popup: getPassAndHint: p= ${p} written to clipboard`);
    navigator.clipboard.writeText(p);
  });
}

// get password and hint from service worker
el.generate.addEventListener("click", getPassAndHint);
