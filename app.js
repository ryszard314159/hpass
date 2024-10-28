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
import { storageGet, storageSet, cleanUp, CRYPTO, sanityCheck,
         globalDefaults, updateLocalStorage, hpassStorage } from "./core/lib.js";
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

// const globalDefaults = {};
// globalDefaults.salt = "Replace Me!";
// globalDefaults.pepper = "_";
// globalDefaults.length = "15";
const URL = "https://hpass.app";

// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
// el.salt = document.getElementById("salt");
// el.pepper = document.getElementById("pepper");
// el.length = document.getElementById("length");
el.burn = document.getElementById("burn");
el.peak = document.getElementById("peak"); // instead of top
el.range = document.getElementById("range");
el.gear = document.getElementById("gear");
el.generate = document.getElementById("generate");
el.hintContainer = document.getElementById("hintContainer");
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
el.exportButton = document.getElementById("exportButton");
el.importButton = document.getElementById("importButton");
el.hamburger = document.getElementById("hamburger");
el.navMenu = document.getElementById("nav-menu");
// el.email = document.getElementById("email");



if (debug > 8) {
  window.addEventListener("DOMContentLoaded", function() {
    alert(`window.addEventListener("DOMContentLoaded"): el.salt.value= ${el.salt.value}`);
  });
}

function noIdlingHere() {
  const debug = true;
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
  const idleTime = debug ? 1e9 : 60000; // 60 secs
  // const idleTime = 60000; // 60 secs
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

document.querySelector(".btn.change").addEventListener("click", function() {
// el.changePassword.addEventListener("click", function() {
  // el.navMenu.classList.toggle("show");
  // el.hamburger.textContent = el.hamburger.textContent === "☰" ? "✕": "☰";
  // alert(`before: ${JSON.stringify(el.newPassword.classList)}`)
  el.newPassword.classList.toggle("show");
  // alert(`after: ${JSON.stringify(el.newPassword.classList)}`)
});

el.masterPassword.addEventListener("keydown", function(event) {
  const debug = false;
  if (debug) console.log(`el.masterPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === 'Enter') {
    if (debug) console.log('masterPassword: Enter key pressed!');
    // event.preventDefault();
    // el.masterPassword.blur();
    setTimeout( () => {
      const storedHash = localStorage.getItem("pwdHash");
      if (storedHash === null) {
        alert("Password Hash was null,\noptions removed & Master Password set to empty string");
        localStorage.clear();
        createHash('').then(hash => hpassStorage.setItem("pwdHash", hash, `el.masterPassword: pwd=''`));
        return;
      }
      const pwd = el.masterPassword.value;
      verifyPassword(storedHash, pwd).then( isCorrect => {
        if (isCorrect) {
          sessionStorage.setItem("password", pwd);
          el.passwordContainer.style.display = "none";
          window.sessionStorage.setItem("passwordContainerHidden", true);
          window.scrollTo(0, 0); // scroll window to the top!
        } else {
          const sessionPassword = sessionStorage.getItem("password");
          if (debug) console.log(`masterPassword: Wrong password - try again!`);
          if (debug) console.log(`masterPassword: storedHash= ${storedHash}, pwd= ${pwd}`);
          if (debug) console.log(`masterPassword: sessionPassword= ${sessionPassword}, CRYPTO.pwd= ${CRYPTO.pwd}`);
          alert("Wrong password - try again!")
        }
      });
      // verifyPassword(oldHash, pwd).then(isCorrect => {
      el.newPassword.focus();
    }, 30);
  }
});


el.newPassword.addEventListener("keydown", async (event) => {
  const debug = true;
  // event.preventDefault();
  // if (debug) console.log(`el.newPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key !== 'Enter') return;
  function _cleanup() {
    el.newPassword.value = '';
    el.masterPassword.value = '';
    el.passwordContainer.style.display = "none";
    // el.newPassword.style.display = "none";
    el.newPassword.classList.toggle("show");
  }
  const masterPassword = el.masterPassword.value;
  const newPassword = el.newPassword.value;
  if (newPassword === masterPassword) {
    alert(`Master Password (=${masterPassword}) NOT changed`);
    _cleanup();
    return;
  }

  const storedHash = localStorage.getItem("pwdHash");
  let verified = await verifyPassword(storedHash, masterPassword);
  console.log(`masterPassword= ${masterPassword}, verified= ${verified}, storedHash= ${storedHash}`)
  let sessionPassword = sessionStorage.getItem("password");
  sessionPassword = (sessionPassword === null) ? '' : sessionPassword;
  if (!verified || masterPassword !== sessionPassword) {
    let m = "Incorrect Master Password!"
    if (debug) {
      m = `${m}\nstoredHash= ${storedHash.slice(0,9)}...`;
      m = `${m}\nmasterPassword= ${masterPassword}`;
      m = `${m}\nstoredPassword= ${sessionPassword}`;
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
  if (!confirm(msg)) {
    _cleanup();
    return;
  }

  const pwdHash = await createHash(newPassword);
  CRYPTO.passwd = newPassword;
  const tag = `el.newPassword: CRYPTO.passwd= ${CRYPTO.passwd}`;
  hpassStorage.setItem("pwdHash", pwdHash, tag);
  const ph = localStorage.getItem("pwdHash")
  verified = await verifyPassword(ph, newPassword);
  console.log(`newPassword= ${newPassword}, verified= ${verified}, stored pwdHash= ${pwdHash}`);
  sessionStorage.setItem("password", newPassword);

  try {
    for (const key of CRYPTO.encryptedItems) {
      const fromStorage = localStorage.getItem(key);
      if (fromStorage === null) continue;
      const decrypted = await decryptText(masterPassword, fromStorage);
      const encrypted = await encryptText(newPassword, decrypted);
      hpassStorage.setItem(key, encrypted);
    }
  } catch (error) {
    console.error("Error updating encrypted items:", error);
  }

  _cleanup();
  return;
});

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
  CRYPTO.pwd = '';
  sessionStorage.setItem("password", '');
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

function createSplashScreen(opts) {
  const debug = true;
  if (debug) console.log("createSplashScreen: at the START");
  if (debug) console.trace();
  createHash(CRYPTO.passwd).then(pwdHash => localStorage.setItem("pwdHash", pwdHash));
  let msg = `<h3>To start using HPASS:</h3>
  <ul>
  <li>Read the <strong>Basics</strong> below.
  <li>Close this menu.
  <li>Enter Master Password (<strong>default='${CRYPTO.passwd}'</strong>).
  <li>Change (<img src="icons/change.svg" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;">)
      Master Password (<strong>initial value='${CRYPTO.passwd}'</strong>)
      to a strong one.
      See Help (under ? icon) for guidance how to select good master password.
      Write it down and store it in safe location.
  </ul>`;
  // <h3>Basics:</h3>
  // <ol>
  // <li>Enter a site password hint in Enter Hint box.
  //     This can be a full name, or your favorite nick name,
  //     of the site you need the password for e.g. facebook or fb etc.
  // <li>Click on <strong style="font-size: 1.2rem;">></strong>
  //     in top-right corner to generate password.
  //     It will be copied to the clipboard.
  // <li>Paste password from the clipboard where you need it.
  // </ol>
  // <br>
  // Generated password is uniquely determined by site Hint
  // together with:
  //  <hr/>
  // <p>
  // <ul>
  // <li>Secret (= ${opts.salt} )
  // <li>Special Character (= ${opts.pepper} )
  // <li>Length (= ${opts.length} )
  // <ul>
  // </p>
  // <br>
  // To display and change these settings click on the gear icon
  // in the top-left corner.
  // Note - that to generate the same password -
  // site Hint, Secret, Special Character and Length have to be exactly the same.
  // See Help page under ? icon for more details.
  // <br>`;
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
    window.location.href = 'help.html';
  });
  content.appendChild(closeButton);
  container.appendChild(content);
  container.style.display = "block";
  document.body.appendChild(container);
  if (debug) console.log("createSplashScreen: at the end");
  if (debug) console.trace();
}
//
//

if ("serviceWorker" in navigator) {
  const debug = false;
  const swPath = "sw.js";
  if (debug) console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
  .register(swPath)
  .then((reg) => {
    // (async () => {
    //   let pwd = sessionStorage.getItem("password");
    //   pwd = (pwd === null) ? '' : pwd;
    //   CRYPTO.passwd = pwd;
    //   const storedHash = localStorage.getItem("pwdHash");
    //   if (!verifyPassword(storedHash, pwd)) {
    //     const pwdHash = await createHash(CRYPTO.passwd);
    //     hpassStorage.setItem("pwdHash", pwdHash, `serviceWorker: CRYPTO.passwd= ${CRYPTO.passwd}`);
    //   }      
    // try {
    //   opts = await storageGet({key: "options"});
    // } catch (error) {
    //   alert(`Opts fetch failed: set to generic: CRYPTO.passwd= ${CRYPTO.passwd}`)
    // }
      let opts = localStorage.getItem("options");
      if (opts === null) {
        if (debug) console.log("app: register: null options in localStorage!");
        opts = setGenericOptions();
        if (debug) console.log("app: register: set to generic: opts= ", opts);
      } else {
        if (debug) console.log("app: register: exist already: opts= ", opts);
      }
      if (debug) console.log("app: register: globalDefaults= ", globalDefaults);
    // }) ();

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
  p.style.top = "20%";
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

// el.gear.addEventListener("click", () => {
//   const debug = false;
//   if (debug) console.log("app: gear click:0: el.gear.src= ", el.gear.src);
//   const x = el.gear.src.split("/").slice(-1)[0];
//   el.gear.src = (x == "gear.svg") ? "icons/cross.svg" : "icons/gear.svg";
//   el.gear.style.backgroundColor = (x == "gear.svg") ? "red" : "lightgreen";
//   // el.gear.backgroundColor = "pink";
//   if (debug) {
//     console.log("app: gear click:1: el.gear.src= ", el.gear.src);
//     console.log(
//       "app: gear click:1: el.gear.style.backgrounColor= ",
//       el.gear.style.backgroundColor
//     );
//     console.log("app: gear click:1: x= ", x);
//     console.log(
//       "apps:1: settings zIndex= ", el.settings.style.zIndex,
//       "apps:1: hidesettings zIndex= ", el.hidesettings.style.zIndex
//     );
//     console.log(
//       "apps:3: settings display= ", getComputedStyle(el.settings).display,
//       "apps:3: hidesettings display= ", getComputedStyle(el.hidesettings).display
//     );
//   }
//   el.hidesettings.style.display = getComputedStyle(el.hidesettings).display === "none" ? "block" : "none";
//   el.settings.style.display = getComputedStyle(el.settings).display === "none" ? "block" : "none";
//   if (debug){
//     console.log(
//       "apps:4: settings display= ", getComputedStyle(el.settings).display,
//       "apps:4: hidesettings display= ", getComputedStyle(el.hidesettings).display
//     );
//   }
// });

// const ops = ["pepper", "salt", "length", "burn", "peak"];
// ops.forEach((x) => {
//   const debug = false;
//   let cross = `${x}Cross`;
//   if (debug) console.log("app:0: ops.forEach: x= ", x, " cross= ", cross);
//   el[cross].addEventListener("click", () => {
//     if (debug) console.log("app:1: ops.forEach: x= ", x, " cross= ", cross);
//     el[x].value = null;
//   });
// });

function cleanClean(v) {
  const valid = new Set(["true", "false", true, false, 0, 1, "0", "1"]);
  return valid.has(v) ? v : true;
}

// document.querySelectorAll('.export').forEach(function(element) {
//   const timeDiffThreshold = 300;
//   let lastClickTime = 0;
//   let pendingClick = null;
//   element.addEventListener('click', function (event) {
//     const currentTime = Date.now();
//     const timeDiff = currentTime - lastClickTime;
//     lastClickTime = currentTime;
//     clearTimeout(pendingClick);
//     if (timeDiff > timeDiffThreshold) {
//       pendingClick = setTimeout(function() {
//         handleExport({decrypted: false}); // Single click
//       }, timeDiffThreshold);
//     } else {
//       handleExport({decrypted: true}); // Double click
//     }
//   });
// });

// el.share.addEventListener("click", function () {
//   copyToClipboard(URL);
//   showPopup(`${URL}<br>copied to clipoard - share it! `, 3 * SHORTPOPUP);
// });

document.querySelectorAll(".reset").forEach(function(element) {
  element.addEventListener("click", function (event) {
    const debug = false;
    if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
    if (confirm(`All existing settings will be removed!\nPassword=''\nClick OK to proceed.`)) {
      event.preventDefault();
      localStorage.removeItem("options");
      localStorage.removeItem("sites");
      ( async () => {
        const pwd = '';
        sessionStorage.setItem("password", pwd);
        CRYPTO.passwd = pwd;
        const pwdHash = await createHash(pwd);
        hpassStorage.setItem("pwdHash", pwdHash, `edit: reset: CRYPTO.passwd= ${pwd}, pwdHash= ${pwdHash}`)
      }) ();
      // window.location.reload();
      const opts = setGenericOptions();
      // storageSet({key: "options"}, opts); // done in setGenericOptions
      // el.salt.value = opts.salt;
      // el.pepper.value = opts.pepper;
      // el.length.value = opts.length;
    }
  });
});

document.getElementById("logop").addEventListener("click", function () {
  copyToClipboard(URL);
  showPopup(`${URL}<br>copied to clipoard - share it! `, 3 * SHORTPOPUP);
});

// el.reset.addEventListener("click", function (event) {
// document.querySelectorAll(".reset").forEach(function(element) {
//   element.addEventListener("click", function (event) {
//     const debug = false;
//     if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
//     if (confirm("Confirm reset: all existing settings will be removed!")) {
//       event.preventDefault();
//       localStorage.clear();
//       window.location.reload();
//     }
//   });
// });

window.onload = function() {
  // alert("PAGE LOADED!");
  // TODO: revisit it later
  // if (sessionStorage.getItem("passwordContainerHidden")) {
  //   el.passwordContainer.style.display = "none";
  //   sessionStorage.removeItem("passwordContainerHidden");
  // }
  window.scrollTo(0, 0);
}

document.querySelectorAll(".lock").forEach(function(element) {
  element.addEventListener("click", function (event) {
    const masterPassword = document.getElementById("masterPassword");
    const passwordContainer = document.getElementById("passwordContainer");
    const lock = document.getElementById("lockSound");
    if (masterPassword && passwordContainer && lockSound) {
      el.masterPassword.value = "";
      // el.passwordContainer.style.display = "block";
      el.passwordContainer.style.display = "none"; // TODO: change back to block
      lock.currentTime = 0; // Reset audio to start
      lock.volume = 0.1;
      lock.play();
    } else {
      console.error("Missing required elements.");
    }
  })
});

//
window.addEventListener("storage", function(event) {
  // Compare the old and new values
  // console.log(`storage change event= `, event)
  if (event.key && event.key !== "__storage_test__") {
    const logIt = event.key === "pwdHash" && (event.oldValue !== event.newValue)
    if (logIt) {
      console.log(`storage: Key >> ${event.key} << changed from ${event.oldValue} to ${event.newValue}`);
    }
  }
});
//



async function generateFun(event) {
  const debug = false;
  event.preventDefault();
  if (debug) console.log("generateFun: event.preventDefault() added");
  let opts = await storageGet({key: "options"});
  const hint = el.hint.value;
  if (hint !== "undefined") {
    const sites = await storageGet({key: "sites"});
    if (sites !== null) {
      if (sites[hint] !== "undefined") {
        opts = {...opts, ...sites[hint]};
      }
    }
  }
  const salt = opts.salt // = el.salt.value;
  const pepper = opts.pepper // = el.pepper.value;
  let length = opts.length // = el.length.value;
  length = (length === "") ? globalDefaults.length : Math.max(Math.min(length, MAXLENGTH), MINLENGTH);
  if (debug) console.log("generateFun:0: opts= ", opts);
  // el.length.value = opts.length;
  // opts.salt = el.salt.value = (salt === "") ? globalDefaults.salt : salt;
  // opts.pepper = el.pepper.value = (pepper === "") ? globalDefaults.pepper : pepper;
  // opts.length = el.length.value = (length === "") ? globalDefaults.length : length;
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

el.hintContainer.addEventListener('submit', function (event) {
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
// function handleExport(args = {}) {
//   args = {fileName: "hpass-settings.json", decrypted: false, ...args};
//   const toExport = {}; // prepare localStorage copy for export
//   Object.keys(localStorage).forEach ((key) => {toExport[key] = localStorage.getItem(key)});
//   toExport.encrypted = !args.decrypted;

//   console.log(`DEBUG: handleExport: toExport= ${JSON.stringify(toExport)}`);

//   function finish() {
//     const x = JSON.stringify(toExport, null, 2);
//     const blob = new Blob([x], { type: 'application/json' });
//     const link = document.createElement('a');
//     link.download = args.fileName;
//     link.href = window.URL.createObjectURL(blob);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   }
  
//   if (args.decrypted) {
//     if (!confirm("Plain text export!")) return;
//     const decryptionPromises = CRYPTO.encryptedItems.map(async (key) => {
//       if (toExport[key] === undefined) return;
//       // console.log(`DEBUG: handleExport: toExport[${key}]= ${toExport[key]}`);
//       toExport[key] = await decryptText(CRYPTO.passwd, toExport[key]);
//     });
//     Promise.all(decryptionPromises).then(() => {
//       finish();
//     });
//   } else {
//     if (!confirm("Encrypted export\nDouble Click for decrypted (plain text) export!")) return;
//     finish();
//   }
// }

const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
// document.body.querySelectorAll(".import").forEach(function(element) {
//   const debug = false;
//   if (debug) console.log(".import: selected");
//   element.addEventListener("click", function() {
//     if (debug) console.log(".import: clicked");
//     el.fileInputModal.style.display = "block";
//     el.fileInputModal.style.zIndex = "99";
//   });
// });

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


