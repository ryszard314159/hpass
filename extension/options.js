const optsKeys = ["salt", "pepper", "length", "email", "username"];
const el = {};
const opts = {};
optsKeys.forEach((k) => {
  el[k] = document.getElementById(k); // select options.html web elements
  opts[k] = el[k].value;
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

// save current options in local storage

function saveOptions() {
  optsKeys.forEach((x) => {
    opts[x] = el[x].value;
  });
  chrome.storage.local.set({ options: opts });
}

function resetOptions() {
  optsKeys.forEach((x) => {
    el[x].value = "";
  });
}

el.save.addEventListener("click", saveOptions);
el.reset.addEventListener("click", resetOptions);
