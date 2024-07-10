/*
TODO:
1 - restore does not work for Secret
*/
"use strict";
import { deepEqual, get_random_string, getPass, objDiff,
  CHARS, MAXLENGTH, MINLENGTH } from "./core/lib.js";

const SHORTPOPUP = 1e3; // short popup time
const LONGPOPUP = 1e5; // long popup time

const globalDefaults = {};
globalDefaults.salt = "Replace Me!";
globalDefaults.pepper = "_";
globalDefaults.length = 15;
// globalDefaults.minlength = MINLENGTH;
// globalDefaults.maxlength = MAXLENGTH;
// globalDefaults.url = "https://hpass.app";
const URL = "https://hpass.app";
// globalDefaults.clean = true;

// Selecting elements
const el = {};
// el.overlay = document.getElementById("overlay");
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.burn = document.getElementById("burn");
el.peak = document.getElementById("peak"); // instead of top
el.range = document.getElementById("range");
el.gear = document.getElementById("gear");
el.generate = document.getElementById("generate");
el.hintForm = document.getElementById("hintForm");
// el.generateDiv = document.getElementById("generateDiv");
el.passwords = document.getElementById("passwords");
el.hidesettings = document.getElementById("hidesettings");
el.settings = document.getElementById("settings");
el.help = document.getElementById("help");
el.save = document.getElementById("save");
el.share = document.getElementById("share");
el.reset = document.getElementById("reset");
el.hintButton = document.getElementById("hintButton");
// el.back = document.getElementById("back");
// el.menu = document.getElementById("menu");
el.adunit = document.getElementById("adunit");
el.more = document.getElementById("more");
// el.menuList = document.getElementById("menuList");
el.notify = document.getElementById("notify");
el.pepperCross = document.getElementById("pepperCross");
el.saltCross = document.getElementById("saltCross");
el.lengthCross = document.getElementById("lengthCross");
el.burnCross = document.getElementById("burnCross");
el.peakCross = document.getElementById("peakCross");
el.cleanCross = document.getElementById("cleanCross");
el.version = document.getElementById("version");
el.clickSound = document.getElementById('clickSound');
el.fileInputModal = document.getElementById("fileInputModal");
el.importButton = document.getElementById("importButton");

function createSplashScreen(opts) {
  let msg = `<h3>Basic usage:</h3>
  <ol>
  <li>Enter a password hint in Enter Hint box.
      This can be a full name, or your favorite nick name,
      of the site you need the password for e.g. facebook or fb etc.
  <li>Click on <strong style="font-size: 1.2rem;">></strong>
      in top-right corner to generate password.
      It will be copied to the clipboard.
  <li>Paste password from the clipboard where you need it.
  </ol>
  <br>
  <hr/>
  Generated password is uniquely determined by Hint
  together with
  <ul>
  <li>Secret (= ${opts.salt} )
  <li>Special Character (= ${opts.pepper} ), and
  <li>Length (= ${opts.length} ) options
  <ul>
  <br>
  To display and change these options click on the gear icon
  in the top-left corner.
  Note, that to generate the same password values for
  Hint, Secret, Special Character and Length have to be exactly the same.
  See Help page under ? icon for more details.`;
  // <h4>Current options are:</h4><br> 
  // <ol>
  // <li>Secret = ${opts.salt}
  // <li>Special Character = ${opts.pepper}
  // <li>Length = ${opts.length}
  // </ol>
  // <br>
  const container = document.createElement("div"); // container
  container.id = "splash-screen-container";
  container.className = "modal";
  const content = document.createElement("div"); // content
  content.id = "splash-screen-content";
  content.className = "modal-content";
  content.innerHTML = msg;
  const closeButton = document.createElement('span');
  closeButton.className = 'close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', function() {
    container.style.display = "none";
  });
  // const paragraph = document.createElement('p');
  // paragraph.textContent = 'Select a JSON file to import sites settings:';
  content.appendChild(closeButton);
  container.appendChild(content);
  container.style.display = "block";
  document.body.appendChild(container);
  console.log("createSplashScreen: at the end");
}

if ("serviceWorker" in navigator) {
  const swPath = "sw.js";
  console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => {
      const defaults = { ...globalDefaults };
      // const salt = getPass({ hint: "", length: 8 });
      // defaults.salt = salt;
      // globalDefaults.salt = salt;
      console.log("app: sw registered!", reg);
      console.log("app: before createSplashScreen");
      // createSplashScreen();
      console.log("app: after createSplashScreen");
      let opts = JSON.parse(window.localStorage.getItem("options"));
      if (opts === null) {
        // alert("app: null opts in localStorage!");
        console.log("app: register: null opts in localStorage!");
        opts = defaults;
        const charset = CHARS.digits + CHARS.lower + CHARS.upper;
        opts.salt = get_random_string(16, charset);
        window.localStorage.setItem("options", JSON.stringify(opts));
        // let msg = `<br> Default secret is<br><br> ${opts.salt}`;
        // msg = msg + "<br><br> You should change it";
        // msg = msg + "<br>to some personalized value.";
        let msg = `<br>Randomly generated secret is
            <br><br><strong>${opts.salt}</strong><br><br>
            You can use it as is or you can to change it
            to some personalized value easy for you to remember.
            <br><br>NOTE: to generate the same passwords on multiple
            devices this secret and other options should be the same
            on all devices.`;
        // alert("app: register: options set to default values on install");
        // showPopup(msg, LONGPOPUP);
        createSplashScreen(opts);
        console.log("app: register: opts=defaults= ", opts);
      } else {
        // alert("app: register: options exists in localStorage!");
        console.log("app: register: exist already: opts= ", opts);
      }
      console.log("app: register: globalDefaults= ", globalDefaults);
      el.pepper.value = opts.pepper;
      el.salt.value = opts.salt;
      el.length.value = opts.length;
      el.length.min = opts.minlength;
      el.length.max = opts.maxlength;
      console.log("app: register: els set to opts= ", opts);
      //
      // NOTE: if you are working with DevTools
      //       make sure that the Bypass for Network checkbox
      //       is unchecked. If it is checked .controller will
      //       be null
      // See:
      // (1) https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controller
      //      "...This property returns null if the request is a force refresh..."
      // (2) https://www.youtube.com/watch?v=1d3KgacJv1I (Debugging Serviceworker Controller null)
      //
      if (navigator.serviceWorker.controller) {
        const msg = { type: "GET_VERSION" };
        console.log(
          `app: register: This page is currently controlled by: ${navigator.serviceWorker.controller}`
        );
        console.log("app: register: msg= ", msg);
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        console.log(
          "app: register: This page is not currently controlled by a service worker."
        );
      }
    })
    .catch(console.error("app: registration failed"));
}

navigator.serviceWorker.addEventListener("message", (event) => {
  console.log("app: message: event= ", event);
  if (event.data && event.data.type === "VERSION") {
    console.log("app: message: event.data= ", event.data);
    el.version.innerHTML = `${event.data.version}`;
  }
});

/**
 * Copy a string to clipboard
 * @param  {String} string         The string to be copied to clipboard
 * @return {Boolean}               returns a boolean correspondent to the success of the copy operation.
 * @see https://stackoverflow.com/a/53951634/938822
 */
function copyToClipboard(string) {
  let textarea;
  let result;

  try {
    textarea = document.createElement("textarea");
    textarea.setAttribute("readonly", true);
    textarea.setAttribute("contenteditable", true);
    textarea.style.position = "fixed"; // prevent scroll from jumping to the bottom when focus is set.
    textarea.value = string;

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    const range = document.createRange();
    range.selectNodeContents(textarea);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    textarea.setSelectionRange(0, textarea.value.length);
    result = document.execCommand("copy");
  } catch (err) {
    console.error(err);
    result = null;
  } finally {
    document.body.removeChild(textarea);
  }

  // manual copy fallback using prompt
  if (!result) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const copyHotkey = isMac ? "⌘C" : "CTRL+C";
    result = prompt(`Press ${copyHotkey}`, string); // eslint-disable-line no-alert
    if (!result) {
      return false;
    }
  }
  return true;
}

function extractSecondaryDomain(x) {
  // const regex = /^https?:\/\/([a-z0-9]+\.)+[a-z0-9]+(\/.*)?$/;
  const regex = /^https?:\/\//;
  if (!regex.test(x)) return x; // no url found, return as is
  let a = x.replace(/^https?:\/\//i, ""); // drop leading https?://
  let b = a.replace(/\/.*$/, ""); // remove tail i.e. from the first / to the end
  let c = b.split("."); // split on .
  if (c.length < 2) return b;
  let d = c.slice(-2, -1)[0];
  return d;
}

function cleanHint(prompt) {
  let hint = prompt.toLowerCase();
  let domain = extractSecondaryDomain(hint);
  return domain;
}

function showPopup(msg, timeOut, bkg = "lightgreen") {
  const p = document.createElement("div");
  p.innerHTML = msg;
  p.style.display = "block";
  // p.style.position = "absolute";
  p.style.position = "fixed";
  p.style.fontSize = "1.5rem";
  p.style.backgroundColor = bkg;
  p.style.border = "0.1px solid black";
  p.style.zIndex = 9;
  // p.style.top = "20%";
  // p.style.right = "10%";
  p.style.top = "50%";
  p.style.left = "50%";
  p.style.transform = "translate(-50%, -100%)"
  p.style.width = "80%";
  p.style.textAlign = "center";
  p.style.borderRadius = "15px";
  p.style.padding = "1rem 0 1rem 0";
  p.style.overflow = "auto";
  p.style.boxShadow = "4pt 4pt 4pt grey";
  // p.style.classList = "popup";
  const x = document.createElement("button");
  x.innerHTML = "⨉" // "X";
  x.style.fontSize = "2rem";
  x.style.position = "absolute";
  x.style.top = "0.2rem";
  x.style.right = "1rem";
  x.style.backgroundColor = "transparent";
  x.style.border = "0px solid black";
  p.appendChild(x);
  document.documentElement.appendChild(p);
  x.addEventListener("click", () => {
    p.remove();
  });
  setTimeout(() => p.remove(), timeOut);
}

// function closeOverlay() {
//   // Code to close the overlay, e.g., remove the .overlay element from the DOM
//   document.querySelector('.overlay').remove();
// }
// el.overlay.addEventListener("click", closeOverlay);

// el.gear.addEventListener("click", () => {
//   el.adunit.classList.toggle("slide-in");
//   el.menu.classList.toggle("slide-in");
//   console.log("app: gear click:0: el.gear.src= ", el.gear.src);
//   const x = el.gear.src.split("/").slice(-1)[0];
//   el.gear.src = x == "gear.svg" ? "icons/cross.svg" : "icons/gear.svg";
//   el.gear.style.backgroundColor = x == "gear.svg" ? "red" : "lightgray";
//   // el.gear.backgroundColor = "pink";
//   console.log("app: gear click:1: el.gear.src= ", el.gear.src);
//   console.log(
//     "app: gear click:1: el.gear.style.backgrounColor= ",
//     el.gear.style.backgroundColor
//   );
//   console.log("app: gear click:1: x= ", x);
// });

// Switch over/under positions of adunut and menu elements...

// el.adunit.classList.toggle("slide-in");
// el.menu.classList.toggle("slide-in");

el.gear.addEventListener("click", () => {
  console.log("app: gear click:0: el.gear.src= ", el.gear.src);
  const x = el.gear.src.split("/").slice(-1)[0];
  el.gear.src = (x == "gear.svg") ? "icons/cross.svg" : "icons/gear.svg";
  el.gear.style.backgroundColor = (x == "gear.svg") ? "red" : "lightgreen";
  // el.gear.backgroundColor = "pink";
  console.log("app: gear click:1: el.gear.src= ", el.gear.src);
  console.log(
    "app: gear click:1: el.gear.style.backgrounColor= ",
    el.gear.style.backgroundColor
  );
  console.log("app: gear click:1: x= ", x);
  console.log(
    "apps:1: settings zIndex= ", el.settings.style.zIndex,
    "apps:1: hidesettings zIndex= ", el.hidesettings.style.zIndex
  );

  console.log(
    "apps:3: settings display= ", getComputedStyle(el.settings).display,
    "apps:3: hidesettings display= ", getComputedStyle(el.hidesettings).display
  );
  el.hidesettings.style.display = getComputedStyle(el.hidesettings).display === "none" ? "block" : "none";
  el.settings.style.display = getComputedStyle(el.settings).display === "none" ? "block" : "none";
  console.log(
    "apps:4: settings display= ", getComputedStyle(el.settings).display,
    "apps:4: hidesettings display= ", getComputedStyle(el.hidesettings).display
  );
});

{}
// const zIndexA = getComputedStyle(el.hidesettings).zIndex;
// const zIndexB = getComputedStyle(el.settings).zIndex;
// console.log("apps: zIndexA= ", zIndexA, "zIndexB= ", zIndexB);
// el.hidesettings.style.zIndex = zIndexB;
// el.settings.style.zIndex = zIndexA;
// console.log(
//   "apps:2: settings zIndex= ", el.settings.style.zIndex,
//   "apps:2: hidesettings zIndex= ", el.hidesettings.style.zIndex
// );

// el.back.addEventListener("click", () => {
//   el.menu.classList.toggle("slide-in");
// });

const ops = ["pepper", "salt", "length", "burn", "peak"];
ops.forEach((x) => {
  let cross = `${x}Cross`;
  console.log("app:0: ops.forEach: x= ", x, " cross= ", cross);
  el[cross].addEventListener("click", () => {
    console.log("app:1: ops.forEach: x= ", x, " cross= ", cross);
    el[x].value = null;
  });
});

function cleanClean(v) {
  const valid = new Set(["true", "false", true, false, 0, 1, "0", "1"]);
  return valid.has(v) ? v : true;
}

el.save.addEventListener("click", function () {
  const opts = { ...globalDefaults };
  console.log("apps:0: save: opts= ", opts);
  console.log("apps:0: save: MINLENGTH=", MINLENGTH, " MAXLENGTH= ", MAXLENGTH);
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  window.localStorage.setItem("options", JSON.stringify(opts));
  el.length.value = Math.max(Math.min(opts.length, MAXLENGTH), MINLENGTH);
  console.log("apps:1: save: opts= ", opts);
  showPopup("settings saved!", SHORTPOPUP);
  exportSettings();
});

el.share.addEventListener("click", function () {
  // const opts = { ...globalDefaults };
  // console.log("apps:0: share: opts= ", opts);
  // copyToClipboard(opts.url);
  // showPopup(`${opts.url}<br>copied to clipoard - share it! `, 3 * SHORTPOPUP);
  copyToClipboard(URL);
  showPopup(`${URL}<br>copied to clipoard - share it! `, 3 * SHORTPOPUP);
});

el.reset.addEventListener("click", function () {
  let msg = "Double click<br>to restore defaults.<br>";
  msg = msg + "WARNING: your current<br>settings will be lost.";
  console.log("app: reset: msg= ", msg);
  showPopup(msg, 3 * SHORTPOPUP, "red");
});

el.reset.addEventListener("dblclick", function () {
  console.log("app: reset: el= ", el);
  console.log("app: reset: globalDefaults= ", globalDefaults);
  el.pepper.value = globalDefaults.pepper;
  el.salt.value = globalDefaults.salt;
  el.length.value = globalDefaults.length;
  // el.length.min = MINLENGTH;
  // el.length.max = MAXLENGTH;
  console.log("app: reset: el.pepper.value= ", el.pepper.value);
  console.log("app: reset: el.salt.value= ", el.salt.value);
  console.log("app: reset: el.length.value= ", el.length.value);
  // console.log("app: reset: el.length.min= ", el.length.min);
  // console.log("app: reset: el.length.max= ", el.length.max);
  showPopup("defaults restored!", SHORTPOPUP);
});

el.hint.addEventListener("mouseout", () => {
  console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  // if (cleaned) {
  console.log("app:1: mouseout: el.hint.value= ", el.hint.value);
  el.hint.value = cleanHint(el.hint.value); // cleaned);
  console.log("app:2: mouseout: el.hint.value= ", el.hint.value);
  console.log("app:3: mouseout: el.hint.value= ", el.hint.value);
});

// const el = {};
// el.hint = document.getElementById("hint");
// el.salt = document.getElementById("salt");

el.hint.addEventListener("input", () => {
  setTimeout(() => {
    // let sites = JSON.parse(window.localStorage.getItem("sites"));
    let opts = getHintOpts(el.hint.value);
    console.log(`hint: keypressed: value= ${el.hint.value}`);
    console.log(`hint: opts=`, opts);
    if (opts !== undefined) {
      el.salt.value = opts.salt;
      el.pepper.value = opts.pepper;
      el.length.value = opts.length;
      // alert('hint: el values set!')
    } else {
      alert('hint: opts undefined?!')
    }
    // window.localStorage.setItem(JSON.stringify(opts));
    // window.localStorage.setItem("options", JSON.stringify(opts));
  }, 0);
});

function setGenericOpts(opts) {
  /*   */
  // sites = {fb: {salt: "fb-salt", pepper: "fb-pepper", length: 9}};
  // window.localStorage.setItem("sites", JSON.stringify(sites));
  const x = JSON.parse(window.localStorage.getItem("options"));
  if (x === null) {
    localStorage.setItem("options",  JSON.stringify(opts));
    console.log(`setGenericOpts: options were null, saved=`, opts);
  }
  if (deepEqual(x, globalDefaults)) {
    localStorage.setItem("options",  JSON.stringify(opts));
    console.log(`setGenericOpts: options were null, saved=`, opts);
  }
}

// function setHintOpts(hint, {salt: opts.salt, pepper: opts.pepper, length: opts.length});
function setHintOpts(hint, opts) {
  // set only global options if hint === ""
  const eqLength = Object.keys(opts).length === Object.keys(globalDefaults).length;
  console.assert(eqLength, "setHintsOpts: wrong length!");
  if (!eqLength) {
    alert('Wrong length!');
  }
  const generic = JSON.parse(window.localStorage.getItem("options"));
  console.log(`setHintOpts: opts=`, opts);
  const diff = objDiff(opts, generic);
  console.log(`setHintOpts: diff= `, diff);
  // const theSameAsGlobal = deepEqual(generic, opts);
  // if (theSameAsGeneric) {
  if (Object.keys(diff).length === 0) {
    console.log("setHintOpts: new opts the same as global - do nothing");
    return;
  }
  if (hint === "") {
    console.log(`setHintOpts: hint= ${hint} :: opts=`, JSON.stringify(opts));
    let msg = `WARNING: global options set to:`;
    msg = `${msg}\n\nSecret= ${opts.salt}\nSpecial Character= ${opts.pepper}`
    msg = `${msg}\nLength= ${opts.length}`;
    alert(msg);
    localStorage.setItem("options",  JSON.stringify(opts));
    return;
  }
  let sites = JSON.parse(window.localStorage.getItem("sites"));
  console.log(`setHintOpts: hint= ${hint}`);
  if (sites === null) {
    sites = {[hint]: diff};
    console.log(`setHintOpts: sites was null, sites=`, sites);
  } else {
    sites[hint] = diff; // store ony values different from generic
    console.log(`setHintOpts: sites was not null, sites=`, sites);
  }
  window.localStorage.setItem("sites",  JSON.stringify(sites));
}

// ...
function getHintOpts(hint) {
  let opts = JSON.parse(localStorage.getItem("options"));
  if (opts === null) {
    opts = globalDefaults;
    localStorage.setItem("options", opts);
  }
  console.log("getHintOpts: generic opts= ", opts);
  const sites = JSON.parse(window.localStorage.getItem("sites"));
  if (sites !== null && sites[hint] !== undefined) {
    console.log(`getHintOpts: hint-specific: sites[${hint}]= `, sites[hint]);
    opts = {...opts, ...sites[hint]};
  }
  console.log("getHintOpts: final opts= ", opts);
  return opts;
}

function generateFun(event) {
  event.preventDefault();
  console.log("generateFun: event.preventDefault() added");
  // toggleSize();
  // navigator.vibrate(10); does not work on iOS
  const opts = {};
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  el.length.value = opts.length;
  // window.localStorage.setItem("options", JSON.stringify(opts));
  console.log("generateFun: opts= ", opts);
  setHintOpts(el.hint.value, opts);
  let args = { ...opts }; // deep copy
  args.burn = el.burn.value;
  args.peak = el.peak.value;
  // el.burn.value = "";
  // el.peak.value = "";
  args.hint = el.hint.value;
  // setHintOpts(args.hint, {salt: opts.salt, pepper: opts.pepper, length: opts.length});
  console.log("generate:1: opts=", opts);
  args.digits = false;
  args.unicode = false;
  args.digits = false;
  args.lower = false;
  args.upper = false;
  args.punctuation = false;
  args.no_shuffle = false;
  args.debug = true;
  args.verbose = true;
  const passwd = getPass(args);
  navigator.clipboard.writeText(passwd);
  showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
  // const status = copyToClipboard(passwd);
  // console.log("generateFun: status= ", status);
  // if (copyToClipboard(passwd)) {
  // if (status) {
  //   console.log("generateFun: status= ", status);
  //   // alert("copyToClipboard SUCCESS!");
  //   // showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
  // } else {
  //   alert("copyToClipboard FAILED");
  // }
}

el.hintForm.addEventListener('submit', function (event) {
  event.preventDefault();
  // Add your form submission handling logic here
});

function handleFeedback() {
  if (navigator.vibrate) { // haptic
      navigator.vibrate(50); // vibrate for 100ms
  }
  if (el.clickSound) { // audio
      // Ensure the audio is ready to play
      el.clickSound.currentTime = 0; // Reset audio to start
      el.clickSound.play();
      console.log("handleFeedback: sound played");
  }
  console.log("handleFeedback: animation added to classList");
  // el.generate.style.animation = 'moveGenerateBtn 0.25s forwards';
  console.log("handleFeedback: animation added to classList");
  el.generate.classList.add('animateGenerate');
  // Reset position after animation ends
  el.generate.addEventListener('animationend', () => {
    // el.generate.style.animation = '';
    el.generate.classList.remove('animateGenerate');
    el.generate.style.left = '55%';
    el.generate.style.transform = 'translateX(0%)';
  }, { once: true });
};

el.generate.addEventListener("click", handleFeedback)
el.generate.addEventListener("click", generateFun);
// el.generate.addEventListener("click", function (event) {
//   event.preventDefault();
//   // Add your button click handling logic here
// });

el.hint.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    generateFun(event);
  }
});

function toggleSize() {
  el.generate.classList.add("active");
  setTimeout(function () {
    el.generate.classList.remove("active");
  }, 100);
}

function handleLinkClick(event) {
  const link = event.currentTarget;
  if (!link.clickCount) {
    link.clickCount = 0;
  }
  link.clickCount++;
  // link.clickCount = !link.clickCount ? 0 : link.clickCount + 1;
  if (link.clickCount === 2) {
    window.location.href = link.href;
  }
  event.preventDefault();
}

/*
from stackoverflow...
function saveAsFile(filename, data) {
    const blob = new Blob([JSON.stringify(data)]);
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.click()
};
saveAsFile('posts.json', posts)

*/

// ChatGPT...

// Function to export settings as a JSON file
function exportSettings(filename = "hpass-site-settings.json") {
  // Convert settings object to JSON string
  const sites = JSON.parse(localStorage.getItem("sites"));
  const settingsJSON = JSON.stringify(sites, null, 2);

  // Create a Blob from the JSON string
  const blob = new Blob([settingsJSON], { type: 'application/json' });

  // Create a link element
  const link = document.createElement('a');

  // Set the download attribute with a filename
  link.download = filename;

  // Create a URL for the Blob and set it as the href attribute
  link.href = window.URL.createObjectURL(blob);

  // Append the link to the document body (required for Firefox)
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}

// // Sample settings data (initial/default settings)
// let settings = {
//   theme: 'dark',
//   notifications: true,
//   autoSave: false,
//   // add other settings here
// };

// Get the modal
// const modal = document.getElementById("fileInputModal");

// Get the button that opens the modal
// const btn = document.getElementById("importButton");

// Get the <span> element that closes the modal
const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
el.importButton.addEventListener("click", function() {
  // modal.style.display = "block";
  el.fileInputModal.style.display = "block";
  // document.getElementById('importFileInput').click();
  // el.importFileInput.click();
})

// When the user clicks on <span> (x), close the modal
span.addEventListener("click", function() {
  el.fileInputModal.style.display = "none";
})

// When the user clicks anywhere outside of the modal, close it
window.addEventListener("click", function(event) {
  if (event.target == el.fileInputModal) {
    el.fileInputModal.style.display = "none";
  }
})

// Function to import settings from a JSON file
function importSettings(event) {
  // const fileInput = document.getElementById('importFileInput');
  // const file = fileInput.files[0];
  const file = el.importFileInput.files[0];

  if (file) {
      console.log('Selected file:', file);
      console.log('File name:', file.name);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      const reader = new FileReader();
      reader.onload = function(e) {
          try {
              // Parse the JSON string from the file
              const importedSettings = JSON.parse(e.target.result);
              const oldSettings = JSON.parse(localStorage.getItem("sites"));
              // Update the application settings
              const settings = { ...oldSettings, ...importedSettings };

              // Apply the settings to your application
              // applySettings(settings);
              localStorage.setItem("sites", JSON.stringify(settings));
              console.log("importSettings: imported= ", importedSettings);
              console.log("importSettings: old= ", oldSettings);
              console.log('importSettings: Settings applied:', settings);
              // Close the modal after successful import
              modal.style.display = "none";
          } catch (error) {
              console.error('Error parsing JSON file:', error);
              alert('Failed to import settings. Please ensure the file is a valid JSON.');
          }
      };
      reader.readAsText(file);
  } else {
      alert('No file selected.');
  }
}

// Function to apply the settings to your application (example implementation)
function applySettings(settings) {
  // Apply the settings (e.g., update the UI, save to local storage, etc.)
  console.log('Settings applied:', settings);
  // Your code to apply the settings goes here
}

// Attach the change event to handle file selection
document.getElementById('importFileInput').addEventListener('change', importSettings);




// const tooltip = document.querySelector('.tooltip');
// const helpLink = document.querySelector('#help');

// tooltip.addEventListener('touchstart', (e) => {
//   tooltip.classList.add('show-tooltip');
// });

// tooltip.addEventListener('touchend', (e) => {
//   setTimeout(() => {
//     tooltip.classList.remove('show-tooltip');
//     helpLink.href && (window.location.href = helpLink.href);
//   }, 500);
// });



// showPopup(`${passwd}<br><br>copied to clipboard:1`, SHORTPOPUP);
// console.log("app: generate: passwd=", passwd, "type= ", typeof passwd);
// if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
// iOS device
// from https://developer.apple.com/forums/thread/691873 (modified)
// IMPORTANT PART: the method body for the new ClipboardItem should return a new Promise
// that contains resolve(new Blob([<DATA_TO_COPY>])
// async function getIt() {
//   return getPass(args);
// }

// const clipboardItem = new ClipboardItem({
//   "text/plain": new Blob([copyText], { type: "text/plain" }),
// });

// const clipboardItem = new ClipboardItem({
//   "text/plain": (async () => {
//     const passwd = await getIt();
//     if (!passwd) return new Blob();
//     return new Blob([passwd], { type: "text/plain" });
//   })(),
// });

// const string = await blob.text();
// const type = blob.type;
// const blob2 = new Blob([string], {type: type});

// navigator.clipboard
//   .write([clipboardItem])
//   .then(() => {
//     // y.text().then(x => console.log("x= ", x))
//     // clipboardItem.text().then((p) => {
//     console.log("app: copied successfully! passwd= ", passwd);
//     // console.log("app: copied successfully! p= ", p);
//     showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
//     // });
//   })
//   .catch((error) => {
//     console.error("app: Failed to copy to clipboard:", error);
//   });

// showPopup(`${passwd}<br><br>copied to clipboard:3`, SHORTPOPUP);

// Now, we can write to the clipboard in Safari
// navigator.clipboard.write([clipboardItem]);
//
// } else {
//   // Non-iOS device
//   navigator.clipboard
//     .writeText(passwd)
//     .then(() => {
//       console.log("app: non-iOS: clipboard copy success! passwd= ", passwd);
//       showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
//     })
//     .catch((err) => console.error("app: clipboard copy error= ", err));
// }
