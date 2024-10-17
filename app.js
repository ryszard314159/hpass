/*
TODO:
0 - use rcz: "start_url": "/hpass/"; main: "start_url": "/", - the same for scope
* - https://stripe.com for payments
1 - ML-KEM to replace CryptoJS https://www.npmjs.com/package/mlkem
2 - restore does not work for Secret
3 - If you need high-performance, high-security cryptography,
    you may want to consider native libraries or more modern JavaScript libraries
    like Web Cryptography API (W3C) :: https://www.w3.org/TR/WebCryptoAPI/
    or Forge.
4 - wipe pwd fields on lock!
5 - set encrypted: 'false' for plain text export
*/
"use strict";

import {
  CHARS, MAXLENGTH, MINLENGTH, deepEqual, getPass, get_random_string, objDiff, rig, setsAreEqual, setsDiff
} from "./core/lib.js";
import { storageGet, storageSet, cleanUp, CRYPTO, sanityCheck } from "./core/lib.js";
import { decryptText, encryptText, createHash, verifyPassword} from "./core/crypto.js"
const debug = 0;

// simulate localStorage in nodejs
if (typeof(window) === 'undefined') {
const localStorage = {};
localStorage.setItem = function(key, value) {
  this[key] = value;
};
localStorage.getItem = function(key) {
  const v = typeof(this[key]) !== 'undefined'? this[key] : null
  return v;
};
localStorage.removeItem = function(key) {
  delete this[key];
};
localStorage.clear = function() {
  const keep = [ 'setItem', 'getItem', 'removeItem', 'clear' ];
  Object.keys(localStorage).forEach(function(k) {
    if (keep.includes(k)) return;
    localStorage.removeItem(k);
  })
};
}

// let PASSWORD = '';

const SHORTPOPUP = 1e3; // short popup time
const LONGPOPUP = 1e5; // long popup time

const globalDefaults = {};
globalDefaults.salt = "Replace Me!";
globalDefaults.pepper = "_";
globalDefaults.length = "15";
const URL = "https://hpass.app";

// Selecting elements
const el = {};
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
el.passwordContainer = document.getElementById("passwordContainer");
el.masterPassword = document.getElementById("masterPassword");
el.newPassword = document.getElementById("newPassword");
el.changePassword = document.getElementById("changePassword");
el.hidesettings = document.getElementById("hidesettings");
el.settings = document.getElementById("settings");
el.help = document.getElementById("help");
el.storeButton = document.getElementById("storeButton");
el.share = document.getElementById("share");
el.reset = document.getElementById("reset");
el.hintButton = document.getElementById("hintButton");
el.adunit = document.getElementById("adunit");
el.more = document.getElementById("more");
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
el.exportButton = document.getElementById("exportButton");
el.importButton = document.getElementById("importButton");
el.hamburger = document.getElementById("hamburger");
el.navMenu = document.getElementById("nav-menu");
// el.email = document.getElementById("email");
el.importFileInput = document.getElementById('importFileInput');
el.fileInputModal = document.getElementById("fileInputModal");

if (debug > 8) {
  window.addEventListener("DOMContentLoaded", function() {
    alert(`window.addEventListener("DOMContentLoaded"): el.salt.value= ${el.salt.value}`);
  });
}

function noIdlingHere() {
  function yourFunction() {
      // alert('inactive!');
      const secretInputs = document.querySelectorAll('.secret');
      secretInputs.forEach((input) => {
        input.value = '';
        // Remove associated storage (if applicable)
        localStorage.removeItem(input.name);
        sessionStorage.removeItem(input.name);
      });
      el.passwordContainer.style.display = "block";
      // el.salt.value = ''; TODO: wipes clean input boxes, but...
      // el.pepper.value = '';
      // el.length.value = '';
      // el.navMenu.classList.toggle("show");
      // your function for too long inactivity goes here
      // e.g. window.location.href = 'logout.php';
  }
  let t; // must be declared here
  const idleTime = 60000; // 60 secs
  function resetTimer() {
      clearTimeout(t); // global function
      t = setTimeout(yourFunction, idleTime);  // time is in milliseconds (1 min)
  } 
  ['load', 'mousemove', 'mousedown', 'touchstart', 'touchmove', 'click',
    'keydown', 'scroll', 'wheel'].forEach((x) => {
    window.addEventListener(x, resetTimer, true);
  });
};
noIdlingHere();

document.querySelectorAll('.email').forEach(function(element) {
  element.addEventListener('click', function() {
    // openEmailClient("info@hpass.app", "subject", "This is the email body");
    const email = "info@hpass.app";
    const subject = "create meaningful subject";
    const body = "Detailed question / comment/ suggestion";
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }
)
});

// TODO: clear cache for password input box
function clearInputCache(inputId) {
  const inputElement = document.getElementById(inputId);
  inputElement.value = "";
  inputElement.setAttribute("autocomplete", "off");

  // Optionally, trigger a change event
  inputElement.dispatchEvent(new Event('change'));
}

el.hamburger.addEventListener("click", function() {
  setTimeout(function() {
    el.navMenu.classList.toggle("show");
  }, 1);
  el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
  el.newPassword.style.display = "none";
});

el.changePassword.addEventListener("click", function() {
  el.navMenu.classList.toggle("show");
  el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
  el.newPassword.style.display = "block";
});

document.querySelectorAll(".change").forEach(function(element) {
  element.addEventListener("click", function (event) {
    // el.navMenu.classList.toggle("show");
    // el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
    el.newPassword.style.display = "block";
  }
)});

el.navMenu.classList.remove("show");

el.masterPassword.addEventListener("keydown", (event) => {
  const debug = false;
  if (debug) console.log(`el.masterPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === 'Enter') {
    if (debug) console.log('masterPassword: Enter key pressed!');
    // event.preventDefault();
    // el.masterPassword.blur();
    setTimeout(() => {
      let oldHash = localStorage.getItem("pwdHash");
      if (oldHash === null) {
        alert("Password Hash was null,\noptions removed & Master Password set to empty string");
        localStorage.clear();
        CRYPTO.passwd = '';
        createHash('').then(hash => localStorage.setItem("pwdHash", hash));
        return;
      }
      const pwd = el.masterPassword.value;
      verifyPassword(oldHash, pwd).then(isCorrect => {
        if (isCorrect) {
          el.passwordContainer.style.display = "none";
          window.scrollTo(0, 0); // scroll window to the top!
        } else {
          if (debug) console.log(`masterPassword: Wrong password - try again!`);
          alert("Wrong password - try again!")
        }
      });
      // verifyPassword(oldHash, pwd).then(isCorrect => {
      el.newPassword.focus();
    }, 9);
  }
});


el.newPassword.addEventListener("keydown", (event) => {
  const debug = false;
  // event.preventDefault();
  // if (debug) console.log(`el.newPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key !== 'Enter') return;
  function _cleanup() {
    el.newPassword.value = '';
    el.masterPassword.value = '';
    el.passwordContainer.style.display = "none";
    el.newPassword.style.display = "none";
  }
  const masterPassword = el.masterPassword.value;
  const newPassword = el.newPassword.value;
  if (newPassword === masterPassword) {
    alert(`Master Password (=${masterPassword}) NOT changed`);
    _cleanup();
    return;
  }
  const storedHash = localStorage.getItem("pwdHash");
  if (!verifyPassword(storedHash, masterPassword) || masterPassword !== CRYPTO.passwd) {
    let m = "Incorrect Master Password!"
    if (debug) {
      m = `${m}\nstoredHash= ${storedHash.slice(0,9)}...`;
      m = `${m}\nmasterHash= ${masterHash.slice(0,9)}...`;
      m = `${m}\nmasterPassword= ${masterPassword}`;
      m = `${m}\nCRYPTO.passwd= ${CRYPTO.passwd}`;
    }
    alert(m);
    el.newPassword.value = '';
    el.masterPassword.value = '';
    return;
  }

  let msg = `Confirm Master Password change:`;
  msg = `${msg}\n\nOld Password= ${masterPassword}`;
  msg = `${msg}\nNew Password= ${newPassword}`;
  if (debug) {
    msg = `${msg}\nstoredHash: ${storedHash.slice(0,9)}...`;
    msg = `${msg}\nnewHash: ${newHash.slice(0,9)}...`;
    msg = `${msg}\nCRYPTO.passwd: ${CRYPTO.passwd}`;
    }
  if (!confirm(msg)) {
    _cleanup();
    return;
  }

  // const masterKey = createKey(masterPassword);
  // const newKey = createKey(newPassword);
  // TODO: clean-up!
  // let m = `masterPassword= ${masterPassword}, newPassword= ${newPassword}`;
  // CRYPTO.encryptedItems.forEach((key) => {
  //   const fromStorage = localStorage.getItem(key);
  //   if (fromStorage === null) return;
  //   decryptText(masterPassword, fromStorage).then(decryptedValue => {
  //       encryptText(newPassword, decryptedValue).then(encryptedValue => {
  //         localStorage.setItem(key, encryptedValue)})
  //   });
  // });
  CRYPTO.passwd = newPassword;
  createHash(CRYPTO.passwd).then(pwdHash => localStorage.setItem("pwdHash", pwdHash));

  (async () => {
    try {
      for (const key of CRYPTO.encryptedItems) {
        const fromStorage = localStorage.getItem(key);
        if (fromStorage === null) continue;
        
        const decrypted = await decryptText(masterPassword, fromStorage);
        if (key === "options") {
          const x = JSON.parse(decrypted);
          el.salt.value = x["salt"];
          el.pepper.value = x["pepper"];
          el.length.value = x["length"];
          // let msg = `DEBUG:1: after password change:`;
          // msg = `${msg}\nel.salt.value= ${el.salt.value}`;
          // msg = `${msg}\nel.pepper.value= ${el.pepper.value}`;
          // msg = `${msg}\nel.length.value= ${el.length.value}`;
          // console.log(msg);
        }
        const encrypted = await encryptText(newPassword, decrypted);
        
        localStorage.setItem(key, encrypted);
      }
    } catch (error) {
      console.error("Error updating encrypted items:", error);
    }
  })();

  // confirm(msg); // TODO: change alert to confirm!!!
  if (debug) {
    alert(`after Master Password changed: localStorage= ${JSON.stringify(localStorage)}`);
  }
  _cleanup();
  // DEBUG CODE
  // const displayedOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  // const storedOpts = storageGet({key: "options"});
  // // alert(`el.newPassword:\ndisplayed= ${JSON.stringify(displayedOpts)}\nstored= ${JSON.stringify(storedOpts)}`);
  // checkOptions();
  return;
});

function checkOptions() {
  if (el.pepper === 'undefined' || el.salt === 'undefined' || Number(el.length) < 4) {
    alert(`ERROR: el.newPassword: salt= ${el.salt}, pepper= ${el.pepper}, length= ${el.length}`);
    console.error(`ERROR: el.newPassword: CallStack= `);
    console.trace();
    alert(`ERROR: el.newPassword: call stack generated... values restored storage`);
    const opts = storageGet({key: "options"});
    alert(`ERROR: el.newPassword: from storage: opts= ${JSON.stringify(opts)}`);
    el.salt = opts.salt;
    el.pepper = opts.pepper;
    el.length = opts.length;
  }
}

function createSplashScreen(opts) {
  const debug = false;
  createHash(CRYPTO.passwd).then(pwdHash => localStorage.setItem("pwdHash", pwdHash));
  let msg = `<h3>To start using HPASS:</h3>
  <ul>
  <li>Read the <strong>Basics</strong> below.
  <li>Close this menu.
  <li>Enter Master Password (<strong>default='${CRYPTO.passwd}'</strong>).
  <li>Change Master Password to a strong one.
      See Help (under ? icon) for guidance.
      Write it down and store it in safe location.
  </ul>
  <h3>Basics:</h3>
  <ol>
  <li>Enter a site password hint in Enter Hint box.
      This can be a full name, or your favorite nick name,
      of the site you need the password for e.g. facebook or fb etc.
  <li>Click on <strong style="font-size: 1.2rem;">></strong>
      in top-right corner to generate password.
      It will be copied to the clipboard.
  <li>Paste password from the clipboard where you need it.
  </ol>
  <br>
  Generated password is uniquely determined by site Hint
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
  site Hint, Secret, Special Character and Length have to be exactly the same.
  See Help page under ? icon for more details.
  <br>`;
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
  content.appendChild(closeButton);
  container.appendChild(content);
  container.style.display = "block";
  document.body.appendChild(container);
  if (debug) console.log("createSplashScreen: at the end");
}

function setGenericOptions() {
  const debug = false;
  if (debug) console.log("setGenericOptions: null options in localStorage!");
  let opts = {...globalDefaults};
  const charset = CHARS.digits + CHARS.lower + CHARS.upper;
  opts.salt = get_random_string(16, charset); //TODO: 
  // opts.salt = "DEBUG!!!"
  if (debug) console.log("setGenericOptions: opts= ", opts);
  if (debug) console.log("setGenericOptions: CRYPTO.passwd= ", CRYPTO.passwd);
  if (debug) alert(`setGenericOptions: CRYPTO.passwd= ${CRYPTO.passwd}`);
  storageSet({key: "options", value: opts, debug: true}).then( () => {
    sanityCheck({key: "options", value: opts, from: "setGenericOptions"});
  });
  localStorage.setItem("encrypted", true);
  let msg = `<br>Randomly generated secret is
      <br><br><strong>${opts.salt}</strong><br><br>
      You can use it as is or you can to change it
      to some personalized value easy for you to remember.
      <br><br>NOTE: to generate the same passwords on multiple
      devices this secret and other options must be the same
      on all devices.`;
  if (debug) console.log("setGenericOptions: before createSplashScreen: opts= ", opts);
  createSplashScreen(opts);
  if (debug) console.log("setGenericOptions: returning opts= ", opts);
  return opts;
}

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
if ("serviceWorker" in navigator) {
  const debug = false;
  const swPath = "sw.js";
  if (debug) console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => {
      createHash(CRYPTO.passwd).then(h => {
        // console.log(`DEBUG: navigator.serviceWorker: CRYPTO.passwd= ${CRYPTO.passwd}`);
        // console.log(`DEBUG: navigator.serviceWorker: h= ${h}`)
        localStorage.setItem("pwdHash", h)
      });

      storageGet({key: "options"}).then( opts => {
        if (opts === null) {
          if (debug) console.log("app: register: null options in localStorage!");
          opts = setGenericOptions();
          if (debug) console.log("app: register: set to generic: opts= ", opts);
        } else {
          if (debug) console.log("app: register: exist already: opts= ", opts);
        }
        if (debug) console.log("app: register: globalDefaults= ", globalDefaults);
        el.pepper.value = opts.pepper;
        el.salt.value = opts.salt;
        el.length.value = opts.length;
        el.length.min = MINLENGTH;
        el.length.max = MAXLENGTH;
      });

      if (debug) console.log("app: register: els set to opts= ", opts);
      if (navigator.serviceWorker.controller) {
        const msg = { type: "GET_VERSION" };
        if (debug) console.log(
          `app: register: This page is currently controlled by: ${navigator.serviceWorker.controller}`
        );
        if (debug) console.log("app: register: msg= ", msg);
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        if (debug) console.log(
          "app: register: This page is not currently controlled by a service worker."
        );
      }
    })
    .catch((error) => {
      console.error("app: registration failed: error=", error);
    });
}

navigator.serviceWorker.addEventListener("message", (event) => {
  const debug = false;
  if (debug) console.log("app: message: event= ", event);
  if (event.data && event.data.type === "VERSION") {
    // console.log("app: message: event.data= ", event.data);
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
  p.style.position = "fixed";
  p.style.fontSize = "1.5rem";
  p.style.backgroundColor = bkg;
  p.style.border = "0.1px solid black";
  p.style.zIndex = 9;
  p.style.top = "50%";
  p.style.left = "50%";
  p.style.transform = "translate(-50%, -100%)"
  p.style.width = "80%";
  p.style.textAlign = "center";
  p.style.borderRadius = "15px";
  p.style.padding = "1rem 0 1rem 0";
  p.style.overflow = "auto";
  p.style.boxShadow = "4pt 4pt 4pt grey";
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

const ops = ["pepper", "salt", "length", "burn", "peak"];
ops.forEach((x) => {
  const debug = false;
  let cross = `${x}Cross`;
  if (debug) console.log("app:0: ops.forEach: x= ", x, " cross= ", cross);
  el[cross].addEventListener("click", () => {
    if (debug) console.log("app:1: ops.forEach: x= ", x, " cross= ", cross);
    el[x].value = null;
  });
});

function cleanClean(v) {
  const valid = new Set(["true", "false", true, false, 0, 1, "0", "1"]);
  return valid.has(v) ? v : true;
}

document.querySelectorAll('.export').forEach(function(element) {
  const timeDiffThreshold = 300;
  let lastClickTime = 0;
  let pendingClick = null;
  element.addEventListener('click', function (event) {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    lastClickTime = currentTime;
    clearTimeout(pendingClick);
    if (timeDiff > timeDiffThreshold) {
      pendingClick = setTimeout(function() {
        handleExport({decrypted: false}); // Single click
      }, timeDiffThreshold);
    } else {
      handleExport({decrypted: true}); // Double click
    }
  });
});

el.share.addEventListener("click", function () {
  copyToClipboard(URL);
  showPopup(`${URL}<br>copied to clipoard - share it! `, 3 * SHORTPOPUP);
});

// el.reset.addEventListener("click", function (event) {
document.querySelectorAll(".reset").forEach(function(element) {
  // alert("reset clicked!");
  element.addEventListener("click", function (event) {
    // alrte("reset clicked!");
    const debug = false;
    if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
    event.preventDefault();
    // alert(`.reset:0: localStorage= ${JSON.stringify(localStorage)}`);
    localStorage.clear();
    window.location.reload();
    // alert(`.reset:1: localStorage= ${JSON.stringify(localStorage)}`);
  })
});

window.onload = function() {
  // alert("PAGE LOADED!");
  window.scrollTo(0, 0);
}

document.getElementById("lock").addEventListener("click", function () {
  // window.location.reload();
  el.passwordContainer.style.display = "block";
  // el.salt.value = ''; // TODO: wipes clean input boxes, but seems to cause problems
  // el.pepper.value = ''; // with password change!?
  // el.length.value = '';
});

el.hint.addEventListener("mouseout", () => {
  const debug = false;
  if (debug) console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  el.hint.value = cleanHint(el.hint.value); // cleaned);
  if (debug) console.log("app:2: mouseout: el.hint.value= ", el.hint.value);
});

el.hint.addEventListener("keydown", (event) => {
  const debug = false;
  const msg = `el.hint.addEventListener: event key: ${event.key}, code: ${event.code}`;
  if (debug) alert(msg);
  if (debug) console.log(msg);
  setTimeout(() => {
    el.hint.value = el.hint.value.toLowerCase().trim();
    getHintOpts(el.hint.value).then( opts => {
      if (opts !== undefined) {
        el.salt.value = opts.salt;
        el.pepper.value = opts.pepper;
        el.length.value = opts.length;
      } else {
        alert('hint: opts undefined?!')
      }
    })
  }, 0);
});

// el.storeButton.addEventListener("click", function() {
//   storeOptions();
// });

// el.storeButton.addEventListener("click", storeOptions);
document.getElementById("save").addEventListener("click", saveOptions);

function saveOptions(args) {
  args = {debug: -1, ...args};
  const debug = args.debug;
  let currentOpts, hint, msg;
  // if (debug < 0) {
    currentOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  // } else {
    // currentOpts = args.options;
  // }
  // if (debug < 0) {
    hint = el.hint.value;
  // } else {
  //   hint = args.hint;
  // }
  const storedOpts = storageGet({key: "options"});
  const diff = objDiff(currentOpts, storedOpts);
  if (hint === '' && Object.keys(diff).length === 0) {
    msg = `NOTE: stored settings are the same! Nothing changed.`
    alert(msg);
    console.log(`saveOptions: ${msg}`);
    return;
  }
  // alert(`storeOptions: el.hint.value= ${el.hint.value}`);
  if (hint === '' && Object.keys(diff).length !== 0) {
    storageSet({key: "options", value: currentOpts});
    msg = `NOTE: new generic settings saved: ${JSON.stringify(currentOpts)}`
    alert(msg);
    console.log(msg)
    return;
  }
  // hint !== ''
  let sites = storageGet({key: "sites"});// decrypt: true is the default!
  if (sites === undefined) alert("ERROR: sites undefined in saveOptions!!!");
  sites = (sites === null || sites === undefined) ? {} : sites;
  if (debug > 0) console.log(`saveOptions: hint= ${hint}, sites= ${JSON.stringify(sites)}`);
  const storedHintValues = sites[hint];
  if (debug > 0) console.log(`storedHintValues= ${JSON.stringify(storedHintValues)}`);
  let replacedOrCreated;
  if (storedHintValues === undefined) {
    sites[hint] = diff;
    replacedOrCreated = 'created';
  } else {
    sites[hint] = objDiff({...storedHintValues, ...currentOpts}, storedOpts);
    replacedOrCreated = 'replaced';
  }
  if (debug > 0) console.log(msg);
  if (debug > 0) console.log(`before : objDiff: storedOpts= ${JSON.stringify(storedOpts)}`);
  if (debug > 0) console.log(`before : objDiff: sites= ${JSON.stringify(sites)}`);
  Object.keys(sites).forEach( (key) => {sites[key] = objDiff(sites[key], storedOpts)});
  if (debug > 0) console.log(`before cleanUp: sites= ${JSON.stringify(sites)}`);
  sites = cleanUp(sites);
  if (debug > 0) console.log(`after cleanUp: typeof(sites)= ${typeof(sites)}, sites= `, sites);
  if (debug > 0) console.log(`after cleanUp: JSON.stringify(sites)= ${JSON.stringify(sites)}`);
  if (sites !== null) {
    if (debug > 0) console.log(`before storageSet: sites IS NOT null`);
    storageSet({key: "sites", value: sites});
    msg = `Hint-specific settings ${replacedOrCreated}.`;
    msg = `${msg}\nHint= ${hint}`;
    msg = `${msg}\nOld settings= ${JSON.stringify(storedHintValues)}`;
    msg = `${msg}\nNew settings= ${JSON.stringify(sites[hint])}`;
    alert(msg);
  } else {
    delete localStorage.sites;
    alert(`All hint-specific settings removed!`);
  }
}
// STORAGE= {"options":{"salt":"0","pepper":"?","length":"15"}};
// storeOptions({hint: '', options: {"salt":"0","pepper":"?","length":"15"}, debug: 9})

// arguments:
//    hint,
//          {salt: opts.salt, pepper: opts.pepper, length: opts.length});

// ...
async function getHintOpts(hint) {
  const debug = false;
  // alert(`getHintOpts: hint= ${hint}`)
  if (debug) console.log("getHintOpts: hint= ", hint)
  let opts = await storageGet({key: "options"});
  if (opts === null) {
    opts = {...globalDefaults};
    await storageSet({key: "options", value: opts});
  }
  if (debug) console.log("getHintOpts: generic opts= ", opts);
  const sites = await storageGet({key: "sites"});
  if (debug) console.log("getHintOpts: sites= ", sites);
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
  const opts = {};
  const salt = opts.salt = el.salt.value;
  const pepper = opts.pepper = el.pepper.value;
  let length = opts.length = el.length.value;
  length = (length === "") ? globalDefaults.length : Math.max(Math.min(length, MAXLENGTH), MINLENGTH);
  if (debug) console.log("generateFun:0: opts= ", opts);
  el.length.value = opts.length;
  opts.salt = el.salt.value = (salt === "") ? globalDefaults.salt : salt;
  opts.pepper = el.pepper.value = (pepper === "") ? globalDefaults.pepper : pepper;
  opts.length = el.length.value = (length === "") ? globalDefaults.length : length;
  if (debug) console.log("generateFun:1: opts= ", opts);
  // setHintOpts(el.hint.value, opts); -- NOTE: use storeOptions and save button instead!!!
  let args = { ...opts }; // deep copy
  args.burn = el.burn.value;
  args.peak = el.peak.value;
  args.hint = el.hint.value;
  if (debug) console.log("generate:1: opts=", opts);
  args.digits = false;
  args.unicode = false;
  args.digits = false;
  args.lower = false;
  args.upper = false;
  args.punctuation = false;
  args.no_shuffle = false;
  args.debug = false;
  args.verbose = true;
  args.length = Number(args.length);
  const passwd = getPass(args);
  navigator.clipboard.writeText(passwd);
  showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
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
  if (link.clickCount === 2) {
    window.location.href = link.href;
  }
  event.preventDefault();
}

// ChatGPT...

// Function to export localStorage as a JSON file
function handleExport(args = {}) {
  args = {fileName: "hpass-settings.json", decrypted: false, ...args};
  const toExport = {}; // prepare localStorage copy for export
  Object.keys(localStorage).forEach ((key) => {toExport[key] = localStorage.getItem(key)});
  toExport.encrypted = !args.decrypted;

  console.log(`DEBUG: handleExport: toExport= ${JSON.stringify(toExport)}`);

  function finish() {
    const x = JSON.stringify(toExport, null, 2);
    const blob = new Blob([x], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = args.fileName;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  if (args.decrypted) {
    if (!confirm("Plain text export!")) return;
    const decryptionPromises = CRYPTO.encryptedItems.map(async (key) => {
      if (toExport[key] === undefined) return;
      // console.log(`DEBUG: handleExport: toExport[${key}]= ${toExport[key]}`);
      toExport[key] = await decryptText(CRYPTO.passwd, toExport[key]);
    });
    Promise.all(decryptionPromises).then(() => {
      finish();
    });
  } else {
    if (!confirm("Encrypted export\nDouble Click for decrypted (plain text) export!")) return;
    finish();
  }
}

const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
document.body.querySelectorAll(".import").forEach(function(element) {
  const debug = false;
  if (debug) console.log(".import: selected");
  element.addEventListener("click", function() {
    if (debug) console.log(".import: clicked");
    el.fileInputModal.style.display = "block";
    el.fileInputModal.style.zIndex = "99";
  });
});

document.body.querySelectorAll(".close").forEach(function(element) {
  const debug = false;
  if (debug) console.log(".close: selected");
  element.addEventListener("click", function(event) {
    const ep = element.parentElement;
    const epp = ep.parentElement;
    if (debug) console.log(".close: clicked");
    if (debug) console.log(".close: element= ", element);
    if (debug) console.log(".close: ep= ", ep);
    if (debug) console.log(".close: epp= ", epp);
    epp.style.display = "none";
  });
});

// When the user clicks on <span> (x), close the modal
// span.addEventListener("click", function() {
//   el.fileInputModal.style.display = "none";
// })

// When the user clicks anywhere outside of the modal, close it
window.addEventListener("click", function(event) {
  if (event.target == el.fileInputModal) {
    el.fileInputModal.style.display = "none";
  }
  if (el.navMenu.classList.contains("show") && 
      !el.navMenu.contains(event.target) && event.target != el.hamburger) {
    el.navMenu.classList.remove("show");
    el.hamburger.textContent = '☰';
    el.newPassword.style.display = "none";
  }
});


// Function to import localStorage from a JSON file
function handleImport(event) {
  const debug = false;
  const file = el.importFileInput.files[0];
  const fileName = el.importFileInput.value;
  if (debug) console.log("handleImport: file=", file);
  if (file) {
      const reader = new FileReader();
      reader.onload = async function(e) {
          try {
              // Parse the JSON string from the file
              if (debug) console.log("handleImport: e.target.result=", e.target.result);
              const importedLocalStorage = JSON.parse(e.target.result);
              console.log("handleImport: importedLocalStorage= ", importedLocalStorage);
              if (debug) alert(`INFO: handleImport: e.target.result= ${e.target.result})}`)
              if (debug) alert(`INFO: handleImport: importedLocalStorage= ${JSON.stringify(importedLocalStorage)}`)
              const backUp = JSON.stringify(localStorage);
              const isEncrypted = JSON.parse(importedLocalStorage["encrypted"]);
              let opts;
              for (const key in importedLocalStorage) {
                const txt = importedLocalStorage[key]; // imported text
                if (!CRYPTO.encryptedItems.includes(key)) { // for pwdHash and encrypted keys
                  localStorage.setItem(key, txt);
                  continue;
                } // for "options" || "sites"
                if (isEncrypted) {
                  localStorage.setItem(key, txt);
                  if (CRYPTO.encryptedItems.includes(key)) {
                      try {
                        const decrypted = await decryptText(CRYPTO.passwd, txt);
                        if (decrypted === null) { // Decryption failed
                          const parsed = JSON.parse(backUp);
                          Object.keys(parsed).forEach((key) => localStorage.setItem(key, parsed[key]));
                          alert(`ERROR: wrong Master Password`);
                          return; // Exit the function
                        } else {
                          // opts = JSON.parse(decrypted);
                          setDisplayedOptions(decrypted);
                        }
                      } catch (error) {
                        console.error('Error parsing JSON file:', error);
                        alert('Failed to import settings. Please ensure the file is a valid JSON.');
                      }
                  }
                } else {
                  encryptText(CRYPTO.passwd, txt).then( encrypted => {
                    localStorage.setItem(key, encrypted);
                  });
                  // opts = JSON.parse(txt);
                  setDisplayedOptions(txt);
                }
              }
              localStorage.setItem("encrypted", true);
              if (debug) alert(`INFO: handleImport: localStorage= ${JSON.stringify(localStorage)}`);
              // const modal = document.getElementById("fileInputModal");
              // el.fileInputModal.style.display = "none"; // TODO: modal is not defined
              alert(`Settings imported from: ${fileName}`);
          } catch (error) {
              console.error('Error parsing JSON file:', error);
              alert('Failed to import settings. Please ensure the file is a valid JSON.');
          }
      };
      reader.readAsText(file);
      el.fileInputModal.style.display = "none";
      el.importFileInput.value = "";
  } else {
      alert('No file selected.');
  }
}

function setDisplayedOptions(decrypted) {
  const debug = false;
  const opts = JSON.parse(decrypted);
  const beforeValues = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  const afterValues = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  let msg = `INFO: setDisplayedOptions:`
  msg = `${msg}\nbeforeValues= ${JSON.stringify(beforeValues)}`
  msg = `${msg}\nnew opts= ${JSON.stringify(opts)}`;
  msg = `${msg}\nafterValues= ${JSON.stringify(afterValues)}`;
  if (debug) alert(msg);
}

el.importFileInput.addEventListener('change', handleImport);
