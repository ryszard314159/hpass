/*
TODO:
1 - restore does not work for Secret
*/
"use strict";
import { deepEqual, get_random_string, getPass, objDiff,
  CHARS, MAXLENGTH, MINLENGTH } from "./core/lib.js";
import { getOptions, setOptions, getCallerInfo, createPasswordHash, setPasswordHash } from "./core/storage.js";

let PASSWORD = "";
let CRYPTO_KEY = null;
const SHORTPOPUP = 1e3; // short popup time
const LONGPOPUP = 1e5; // long popup time

const globalDefaults = {};
globalDefaults.salt = "Replace Me!";
globalDefaults.pepper = "_";
globalDefaults.length = 15;
const URL = "https://hpass.app";

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
el.passwordContainer = document.getElementById("passwordContainer");
el.currentPassword = document.getElementById("currentPassword");
el.newPassword = document.getElementById("newPassword");
el.changePassword = document.getElementById("changePassword");
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
el.hamburger = document.getElementById("hamburger");
el.navMenu = document.getElementById("nav-menu");

// TODO: clear cache for password input box
function clearInputCache(inputId) {
  const inputElement = document.getElementById(inputId);

  // Clear the input value
  inputElement.value = "";

  // Reset autocomplete attribute
  inputElement.setAttribute("autocomplete", "off");

  // Optionally, trigger a change event
  inputElement.dispatchEvent(new Event('change'));
}

// init => bb54068aea85faa7e487530083366be9962390af822e4c71ef1aca7033c83e66

// document.addEventListener("keydown", (event) => {
//   console.log(`Global Key pressed: key=${event.key}, code: ${event.code}`);
// });

el.hamburger.addEventListener("click", function() {
  // const e = el.navMenu;
  // console.log("hamburger clicked!");
  // console.log(`1: el.navMenu.style.display= ${el.navMenu.style.display}`)
  // console.log(`1: getComputedStyle(el.navMenu).display= ${getComputedStyle(el.navMenu).display}`)
  // console.log(`1: el.navMenu.style.zIndex= ${el.navMenu.style.zIndex}`)
  // console.log(`1: getComputedStyle(e).display= ${getComputedStyle(e).display}`)
  // console.log(`1: getComputedStyle(e).display= ${getComputedStyle(e).display}`)
  // e.style.display = getComputedStyle(e).display === "" ? "block" : "";
  // console.log(`2: el.navMenu.style.display= ${el.navMenu.style.display}`)
  // console.log(`2: getComputedStyle(e).display= ${getComputedStyle(e).display}`)
  // if (el.hamburger.textContent === "☰") {
  //   el.newPassword.style.display = "none";
  // }
  // el.newPassword.classList.toggle("show");
  el.navMenu.classList.toggle("show");
  el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
  el.newPassword.style.display = "none";
});

el.changePassword.addEventListener("click", function() {
  // el.newPassword.classList.toggle("show");
  el.newPassword.style.display = "block";
  el.navMenu.classList.toggle("show");
  el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
});

el.currentPassword.addEventListener("keydown", (event) => {
  const debug = false;
  if (debug) console.log(`el.currentPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === 'Enter') {
    if (debug) console.log('currentPassword: Enter key pressed!');
    // event.preventDefault();
    // el.currentPassword.blur();
    setTimeout(() => {
      const pwd = el.currentPassword.value;
      let oldHash = localStorage.getItem("pwdHash");
      if (oldHash === null) {
        alert("pwdHash was null, options removed & PASSWORD set to empty string");
        localStorage.clear();
        oldHash = CryptoJS.SHA256(pwd).toString();
        localStorage.setItem("pwdHash", oldHash);
      }
      const pwdHash = CryptoJS.SHA256(pwd).toString();
      if (debug) {
        console.log(`currentPassword: PASSWORD= ${PASSWORD}`);
        console.log(`currentPassword: pwd= ${pwd}`);
        console.log(`currentPassword: pwdHash= ${pwdHash}`);
        console.log(`currentPassword: oldHash= ${oldHash}`);
        console.log(`currentPassword: typeof(oldHash)= ${typeof(oldHash)}`);
        console.log(`currentPassword: typeof(pwdHash)= ${typeof(pwdHash)}`);
      }
      if (pwdHash === oldHash) {
        el.passwordContainer.style.display = "none";
      } else {
        if (debug) console.log(`currentPassword: Wrong password - try again!`);
        alert("Wrong password - try again!")
      }
      el.newPassword.focus();
    }, 0);
  }
});

// el.newPassword.addEventListener("keydown", (event) => {
el.newPassword.addEventListener("keydown", (event) => {
  const debug = false;
  // event.preventDefault();
  if (debug) console.log(`el.newPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === 'Enter') {
    // event.preventDefault();
    if (debug) console.log('newPassword: Enter key pressed!');
    const oldHash = localStorage.getItem("pwdHash");
    const h = createPasswordHash(el.currentPassword.value)
    if (h !== oldHash) {
      alert("Incorrect Current Password!");
    } else {
      const v = el.newPassword.value;
      PASSWORD = (v.length > 0) ? v : null;
      // const newHash = CryptoJS.SHA256(PASSWORD).toString();
      // localStorage.setItem("pwdHash", newHash);
      setPasswordHash(PASSWORD);
      let msg = `Password to access HPASS changed to:`
      msg = PASSWORD.length > 0 ? `${msg} ${PASSWORD}` : `${msg} empty string`
      if (debug) console.log(`msg= ${msg}`);
      alert(msg);
      el.passwordContainer.style.display = "none";
    }
    // Perform desired actions here
  }
});

// (async () => {
//   try {
//     const { scrypt } = await import('crypto');
    
//     // Example usage of scrypt
//     const password = 'password';
//     const salt = 'salt';
//     scrypt(password, salt, 16, (err, derivedKey) => {
//       if (err) throw err;
//       console.log(derivedKey.toString('hex')); // Prints the derived key
//     });
//   } catch (error) {
//     console.error('Error importing crypto module:', error);
//   }
// })();


function createSplashScreen(opts) {
  const pwdHash = CryptoJS.SHA256(PASSWORD).toString();
  localStorage.setItem("pwdHash", pwdHash);
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
  Generated password is uniquely determined by Hint
  together with:
   <hr/>
  <p>
  <ul>
  <li>Secret (= ${opts.salt} )
  <li>Special Character (= ${opts.pepper} )
  <li>Length (= ${opts.length} )
  <ul>
  </p>
  <br>
  To display and change these settings click on the gear icon
  in the top-left corner.
  Note - that to generate the same password -
  Hint, Secret, Special Character and Length have to be exactly the same.
  See Help page under ? icon for more details.
  <br>
  Current Password is: ${PASSWORD}`;
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

function setGenericOptions() {
  const debug = false;
  if (debug) console.log("setGenericOptions: null options in localStorage!");
  // opts = defaults;
  let opts = {...globalDefaults};
  const charset = CHARS.digits + CHARS.lower + CHARS.upper;
  opts.salt = get_random_string(16, charset);
  setOptions(opts, PASSWORD);
  // setOptions_("setGenericOptions", opts);
  let msg = `<br>Randomly generated secret is
      <br><br><strong>${opts.salt}</strong><br><br>
      You can use it as is or you can to change it
      to some personalized value easy for you to remember.
      <br><br>NOTE: to generate the same passwords on multiple
      devices this secret and other options must be the same
      on all devices.`;
  createSplashScreen(opts);
  if (debug) console.log("setGenericOptions: set opts= ", opts);
  return opts;
}

if ("serviceWorker" in navigator) {
  const swPath = "sw.js";
  console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => {
      // const defaults = {...globalDefaults};
      console.log("app: sw registered!", reg);
      console.log("app: before createSplashScreen");
      console.log("app: after createSplashScreen");
      let opts = getOptions(PASSWORD);
      if (opts === null) {
        console.log("app: register: null options in localStorage!");
        opts = setGenericOptions();
      } else {
        console.log("app: register: exist already: opts= ", opts);
      }
      console.log("app: register: globalDefaults= ", globalDefaults);
      el.pepper.value = opts.pepper;
      el.salt.value = opts.salt;
      el.length.value = opts.length;
      // el.length.min = opts.minlength;
      // el.length.max = opts.maxlength;
      el.length.min = MINLENGTH;
      el.length.max = MAXLENGTH;
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
  const debug = false;
  if (debug) console.log("app: gear click:0: el.gear.src= ", el.gear.src);
  const x = el.gear.src.split("/").slice(-1)[0];
  el.gear.src = (x == "gear.svg") ? "icons/cross.svg" : "icons/gear.svg";
  el.gear.style.backgroundColor = (x == "gear.svg") ? "red" : "lightgreen";
  // el.gear.backgroundColor = "pink";
  if (debug) {
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
  }
  el.hidesettings.style.display = getComputedStyle(el.hidesettings).display === "none" ? "block" : "none";
  el.settings.style.display = getComputedStyle(el.settings).display === "none" ? "block" : "none";
  if (debug){
    console.log(
      "apps:4: settings display= ", getComputedStyle(el.settings).display,
      "apps:4: hidesettings display= ", getComputedStyle(el.hidesettings).display
    );
  }
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
  const debug = false;
  const opts = { ...globalDefaults };
  if (debug) {
    console.log("apps:0: save: opts= ", opts);
    console.log("apps:0: save: MINLENGTH=", MINLENGTH, " MAXLENGTH= ", MAXLENGTH);
  }
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  setOptions(opts, PASSWORD);
  el.length.value = Math.max(Math.min(opts.length, MAXLENGTH), MINLENGTH);
  if (debug) console.log("apps:1: save: opts= ", opts);
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

el.reset.addEventListener("click", function (event) {
  // alert("reset clicked!");
  console.log("reset Event listener triggered!"); // Should log when clicked
  event.preventDefault();
  const debug = false;
  localStorage.clear();
  window.location.reload();
  // const msg = "(1) Double click to reset settings.
  //            <br>";
  // msg = msg + "<br>WARNING: current<br>values will be lost.";
  // const msg = `
  // <br>(1) Double click to reset settings.
  // <br>(2) Change settings as you wish.
  // <br>(3) With empty "Enter Hint" box click > to save them.
  // `;
  // if (debug) console.log("app: 1: reset: msg= ", msg);
  // showPopup(msg, 9 * SHORTPOPUP, "red");
});

el.reset.addEventListener("dblclick", function (event) {
  console.log("Event listener triggered!"); // Should log when clicked
  event.preventDefault(); // Add this line
  const debug = false;
  if (debug) {
    console.log("app: 2: reset: el= ", el);
    console.log("app: 2: reset: globalDefaults= ", globalDefaults);
  }
  const opts = {};
  opts.salt = el.salt.value = globalDefaults.salt;
  opts.pepper = el.pepper.value = globalDefaults.pepper;
  opts.length = el.length.value = globalDefaults.length;
  // el.length.min = MINLENGTH;
  // el.length.max = MAXLENGTH;
  if (debug) {
    console.log("app: 2: reset: el.salt.value= ", el.salt.value);
    console.log("app: 2: reset: el.pepper.value= ", el.pepper.value);
    console.log("app: 2: reset: el.length.value= ", el.length.value);
  }
  setOptions(globalDefaults, PASSWORD);
  showPopup("defaults restored!", SHORTPOPUP);
});

el.hint.addEventListener("mouseout", () => {
  const debug = false;
  if (debug) console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  // if (cleaned) {
  // console.log("app:1: mouseout: el.hint.value= ", el.hint.value);
  el.hint.value = cleanHint(el.hint.value); // cleaned);
  if (debug) console.log("app:2: mouseout: el.hint.value= ", el.hint.value);
  // console.log("app:3: mouseout: el.hint.value= ", el.hint.value);
});

// const el = {};
// el.hint = document.getElementById("hint");
// el.salt = document.getElementById("salt");

el.hint.addEventListener("keydown", (event) => {
  const debug = false;
  const msg = `el.hint.addEventListener: event key: ${event.key}, code: ${event.code}`;
  if (debug) alert(msg);
  if (debug) console.log(msg);
  setTimeout(() => {
    el.hint.value = el.hint.value.toLowerCase().trim();
    let opts = getHintOpts(el.hint.value);
    if (debug) {
      console.log(`hint: keypressed: value= ${el.hint.value}`);
      console.log(msg);
      console.log(`hint: opts=`, opts);
    }
    if (opts !== undefined) {
      el.salt.value = opts.salt;
      el.pepper.value = opts.pepper;
      el.length.value = opts.length;
      // alert('hint: el values set!')
    } else {
      alert('hint: opts undefined?!')
    }
  }, 0);
});

// function setHintOpts(hint, {salt: opts.salt, pepper: opts.pepper, length: opts.length});
function setHintOpts(hint, opts) {
  const debug = false;
  // set only global options if hint === ""
  const eqLength = Object.keys(opts).length === Object.keys(globalDefaults).length;
  console.assert(eqLength, "setHintsOpts: wrong length!");
  if (!eqLength) {
    alert('Wrong length!');
  }
  const x = getOptions(PASSWORD);
  const generic = (x === null) ? setGenericOptions() : x;
  if (debug) {
    console.log(`setHintOpts: generic=`, generic);
    console.log(`setHintOpts: opts=`, opts);
  }// setHintOpts: generic= null
  const diff = objDiff(opts, generic);
  if (debug) console.log(`setHintOpts: diff= `, diff);
  // const theSameAsGlobal = deepEqual(generic, opts);
  // if (theSameAsGeneric) {
  if (Object.keys(diff).length === 0) {
    if (debug) console.log("setHintOpts: new opts the same as global - do nothing");
    return;
  }
  if (hint === "") {
    if (debug) console.log(`setHintOpts: hint= ${hint} :: opts=`, JSON.stringify(opts));
    let msg = `NOTE: generic settings set to:`;
    msg = `${msg}\n\nSecret= ${opts.salt}\nSpecial Character= ${opts.pepper}`
    msg = `${msg}\nLength= ${opts.length}`;
    alert(msg);
    setOptions(opts, PASSWORD);
    return;
  }
  let sites = JSON.parse(window.localStorage.getItem("sites"));
  if (debug) console.log(`setHintOpts: hint= ${hint}`);
  if (sites === null) {
    sites = {[hint]: diff};
    if (debug) console.log(`setHintOpts: sites was null, sites=`, sites);
  } else {
    sites[hint] = diff; // store ony values different from generic
    if (debug) console.log(`setHintOpts: sites was not null, sites=`, sites);
  }
  window.localStorage.setItem("sites",  JSON.stringify(sites));
}

// ...
function getHintOpts(hint) {
  const debug = false;
  let opts = getOptions(PASSWORD);
  if (opts === null) {
    opts = {...globalDefaults};
    setOptions(opts, PASSWORD);
    // setOptions_("getHintOpts", opts);
  }
  if (debug) console.log("getHintOpts: generic opts= ", opts);
  const sites = JSON.parse(window.localStorage.getItem("sites"));
  if (sites !== null && sites[hint] !== undefined) {
    if (debug) console.log(`getHintOpts: hint-specific: sites[${hint}]= `, sites[hint]);
    opts = {...opts, ...sites[hint]};
  }
  if (debug) console.log("getHintOpts: final opts= ", opts);
  return opts;
}

function generateFun(event) {
  const debug = false;
  event.preventDefault();
  if (debug) console.log("generateFun: event.preventDefault() added");
  // toggleSize();
  // navigator.vibrate(10); does not work on iOS
  const opts = {};
  const salt = opts.salt = el.salt.value;
  const pepper = opts.pepper = el.pepper.value;
  let length = opts.length = el.length.value;
  length = (length === "") ? globalDefaults.length : Math.max(Math.min(length, MAXLENGTH), MINLENGTH);
  // opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  if (debug) console.log("generateFun:0: opts= ", opts);
  el.length.value = opts.length;
  opts.salt = el.salt.value = (salt === "") ? globalDefaults.salt : salt;
  opts.pepper = el.pepper.value = (pepper === "") ? globalDefaults.pepper : pepper;
  opts.length = el.length.value = (length === "") ? globalDefaults.length : length;
  if (debug) console.log("generateFun:1: opts= ", opts);
  setHintOpts(el.hint.value, opts);
  let args = { ...opts }; // deep copy
  args.burn = el.burn.value;
  args.peak = el.peak.value;
  // el.burn.value = "";
  // el.peak.value = "";
  args.hint = el.hint.value;
  // setHintOpts(args.hint, {salt: opts.salt, pepper: opts.pepper, length: opts.length});
  if (debug) console.log("generate:1: opts=", opts);
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
  const debug = false;
  if (navigator.vibrate) { // haptic
      navigator.vibrate(50); // vibrate for 100ms
  }
  if (el.clickSound) { // audio
      // Ensure the audio is ready to play
      el.clickSound.currentTime = 0; // Reset audio to start
      el.clickSound.play();
      if (debug) console.log("handleFeedback: sound played");
  }
  if (debug) console.log("handleFeedback: animation added to classList");
  // el.generate.style.animation = 'moveGenerateBtn 0.25s forwards';
  if (debug) console.log("handleFeedback: animation added to classList");
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
  const debug = false;
  // const fileInput = document.getElementById('importFileInput');
  // const file = fileInput.files[0];
  const file = el.importFileInput.files[0];

  if (file) {
      if (debug) {
        console.log('Selected file:', file);
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', file.size);
      }
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
              if (debug) {
                console.log("importSettings: imported= ", importedSettings);
                console.log("importSettings: old= ", oldSettings);
                console.log('importSettings: Settings applied:', settings);
              }
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

/*
'U2FsdGVkX1/BlhWQE+BYYkj8J3tunv53GwiPnZhGmBeNqA8v7KkH7xa7fAgH7BYqupfUR+4PaPraYjR//EiErw=='
'U2FsdGVkX1/eTTDthZtlzGuGnwlVioyYJusnsD1oxI6qTWBk5AGjiP6nLNwC9z7W9/7AQ6c6mjUX5r14sW3cqg=='
'U2FsdGVkX19ZmHO9F8yk9hDq7VDL8cn4tTfPseBRhnNdLWTZjhIWxJU88gziiM63mT+cMIpFmOwdqTU3SyeloQ=='
'U2FsdGVkX19gaVelwShd87Px2HPiRix2ZrDVa/pMyNV59WO0nVQei5zTkLUilBZ7Os1hqr/JRjHFuQ/7Zjw0qg=='
*/
