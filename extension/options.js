const el = {};
const opts = {};
const optsDemo = {};
const optsKeys = ["salt", "pepper", "length", "email", "username"];
// icon - UNICODE (HTML Entity) values
// name - UNICODE official name for the character
optsDemo.pepper = { value: "_", icon: "&#127798;", name: "Hot Pepper" };
optsDemo.salt = {
  value: "top secret!",
  icon: "&#129323;",
  name: "Face with Finger Covering Closed Lips",
};
optsDemo.length = { value: 15, icon: "&#128207;", name: "Straight Ruler" };
optsDemo.email = {
  value: "donkey@winnie.pooh",
  icon: "&#128231;",
  name: "E-Mail Symbol",
};
optsDemo.username = {
  value: "eeore",
  icon: "&#128100;",
  name: "Bust In Silhouette",
};
// select options.html web elements and populate opts object
optsKeys.forEach((k) => {
  el[k] = document.getElementById(k);
  opts[k] = el[k].value;
});
// add buttons from options page
["reset", "save", "demo"].forEach((k) => {
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

/**
 * get options from the page
 * and save them in the local storage
 */
function saveOptions() {
  optsKeys.forEach((x) => {
    opts[x] = el[x].value; // get options from the page ...
  });
  // get MAXLENGTH, MINLENGTH from config in local storage
  chrome.storage.local.get(["config"], (results) => {
    console.log("options: saveOptions: results= ", results);
    // ensure that password length is in [MINLENGTH,MAXLENGTH] range
    let { MAXLENGTH, MINLENGTH } = results.config;
    console.log(
      `options: saveOptions: MAXLENGTH= ${MAXLENGTH}, MINLENGTH= ${MINLENGTH}`
    );
    let corrected = Math.max(MINLENGTH, Math.min(opts.length, MAXLENGTH));
    let v = `options: saveOptions: opts.length= ${opts.length}, corrected= ${corrected}`;
    console.log(v);
    if (opts.length != corrected) {
      el.length.value = opts.length = corrected;
    }
    // ... and save them in local storage
    chrome.storage.local.set({ options: opts });
  });
}

/***  handle click events for 'save', 'demo' and 'reset buttons ***/

el.save.addEventListener("click", saveOptions);

el.demo.addEventListener("click", () => {
  optsKeys.forEach((x) => {
    el[x].value = optsDemo[x].value;
  });
});

el.reset.addEventListener("click", () => {
  optsKeys.forEach((x) => {
    el[x].value = "";
  });
});
