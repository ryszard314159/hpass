import { default_opts, optsKeys } from "./config.js";

const el = {};
const opts = {};
optsKeys.forEach((k) => {
  opts[k] = default_opts[k];
  el[k] = document.getElementById(k); // select options.html web elements
});
// add other elements from options page...
["reset", "save"].forEach((k) => {
  el[k] = document.getElementById(k);
});

function setElements() {
  chrome.storage.local.get(["options"], (results) => {
    console.log("options: setElements: local.get: opts= ", opts);
    console.log(`options: setElements: results.options= ${results.options}`);
    optsKeys.forEach((k) => (el[k].value = opts[k] = results.options[k]));
  });
}

chrome.runtime
  .openOptionsPage()
  .then(setElements, (error) => console.log(`Error: ${error}`));

// save options in local storage

function saveOptions() {
  Object.keys(opts).forEach((x) => {
    opts[x] = el[x].value;
  });
  chrome.storage.local.set({ options: opts });
}

function resetOptions() {
  Object.keys(opts).forEach((x) => {
    el[x].value = default_opts[x];
  });
}

el.save.addEventListener("click", saveOptions);

// reset default options
el.reset.addEventListener("click", () => {
  resetOptions();
  saveOptions();
});
