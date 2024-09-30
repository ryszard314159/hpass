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
*/
"use strict";

// import { JSONStorage } from "node-localstorage";
import { deepEqual, get_random_string, getPass, objDiff,
  CHARS, MAXLENGTH, MINLENGTH } from "./core/lib.js";
import { storageGet, storageSet, getCallerInfo, createHash, createKey,
         kdf, CRYPTO, encryptLocalStorage, decryptLocalStorage } from "./core/lib.js";
// import { CryptoProxy } from "./core/lib.js";

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
globalDefaults.length = 15;
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
el.save = document.getElementById("save");
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
el.importButton = document.getElementById("importButton");
el.hamburger = document.getElementById("hamburger");
el.navMenu = document.getElementById("nav-menu");
// el.email = document.getElementById("email");
el.importFileInput = document.getElementById('importFileInput');
el.fileInputModal = document.getElementById("fileInputModal");
// el.crypt = document.getElementById("crypt");

// function openEmailClient(email, subject, body) {
//   const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
//   window.location.href = mailtoLink;
// }

// el.email.addEventListener("click", function() {
//   openEmailClient("info@hpass.app", "subject", "This is the email body");
// });

// function getCallStack() {
//   const error = new Error();
//   return error.stack;
// }

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

// let isEncrypted = true;
// el.crypt.addEventListener("click", function() {
//   // console.log("crypt: clicked!");
//   const x = document.getElementById("crypt-text");
//   // let isEncrypted = CryptoProxy.encryptedStorage;
//   let isEncrypted = storageGet("encrypted", null);
//   try {
//     if (isEncrypted) {
//       console.log(`el.crypt.addEventListener: el.masterPassword.value= ${el.masterPassword.value}`);
//       if (el.masterPassword.value != CRYPTO.passwd) {
//         alert(`Enter correct Master Password to decrypt settings!`);
//         return;
//       }
//       decryptLocalStorage(CRYPTO.passwd, CRYPTO.encryptedItems);
//     } else {
//       encryptLocalStorage(CRYPTO.passwd, CRYPTO.encryptedItems);
//     }
//   } catch (error) {
//     console.error("el.crypt.addEventListener: error= ", error)
//     alert("el.crypt.addEventListener: error=");
//   }
//   // CryptoProxy.encryptedStorage = !CryptoProxy.encryptedStorage;
//   // console.log(`crypt:1: CRYPTO.encryptedStorage= ${CRYPTO.encryptedStorage}`);
//   x.textContent = isEncrypted ? "Decrypted" : "Encrypted";
//   el.crypt.src = isEncrypted ? "icons/eye-show.svg" : "icons/eye-hide.svg";
// });

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const debug = false;
    const element = mutation.target;
    // const o = {id: element.id, name: element.name, value: element.value, tagName: element.tagName, className: element.className
    const o = {id: element.id, value: element.value,
               tagName: element.tagName, className: element.className};
    if (debug) console.log("observer: mutated object= ", o);
  });
});

document.querySelectorAll(".options").forEach(function(element) {
  observer.observe(element, {
    attributes: true,
    childList: true,
    subtree: true,
  });
});

// document.querySelectorAll(".crypt").forEach(function(element) {
//   element.addEventListener("click", function (event) {
//     // alert("querySelectorAll('.crypt'): clicked!");
//     // let isEncrypted = storageGet("encrypted", null);
//     const hide = element.src.endsWith("icons/eye-hide.svg"); // toggle hide/show
//     if (hide) { // check if password is correct
//       const pwd = el.masterPassword.value;
//       const hash = createHash(pwd);
//       // const storedHash = storageGet("pwdHash", null);
//       const storedHash = localStorage.getItem("pwdHash");
//       console.log("crypt: hash= ", hash);
//       console.log("crypt: storedHash= ", storedHash);
//       if (hash !== storedHash) {
//         alert("Correct Master Password needed for decrypted export!")
//         return;
//       }
//     }
//     element.src = hide ? "icons/eye-show.svg" : "icons/eye-hide.svg"; // // toggle hide/show
//     const show = hide; // toggle hide/show
//     if (show) CRYPTO.enableDecryptedIO();
//     if (!show) CRYPTO.disableDecryptedIO();
//     if (show) element.classList.add("glow");
//     if (!show) element.classList.remove("glow");
//   })
// });

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
        // localStorage.clear();
        CRYPTO.encryptedItems.forEach((key => {
          localStorage.removeItem(key);
        }));
        CRYPTO.passwd = '';
        oldHash = createHash('');
        localStorage.setItem("pwdHash", oldHash);
        if (debug > 1) storageSet({key: "pwdHash", value: oldHash});
        if (debug > 1) storageSet({key: "pwd", value: CRYPTO.passwd});
        localStorage.setItem("pwd", CRYPTO.passwd);
        return;
      }
      const pwd = el.masterPassword.value;
      const pwdHash = createHash(pwd);
      if (debug) {
        console.log(`masterPassword: CRYPTO.passwd= ${CRYPTO.passwd}`);
        console.log(`masterPassword: pwd= ${pwd}`);
        console.log(`masterPassword: pwdHash= ${pwdHash}`);
        console.log(`masterPassword: oldHash= ${oldHash}`);
        console.log(`masterPassword: typeof(oldHash)= ${typeof(oldHash)}`);
        console.log(`masterPassword: typeof(pwdHash)= ${typeof(pwdHash)}`);
      }
      if (pwdHash === oldHash) {
        el.passwordContainer.style.display = "none";
      } else {
        if (debug) console.log(`masterPassword: Wrong password - try again!`);
        alert("Wrong password - try again!")
      }
      el.newPassword.focus();
    }, 9);
  }
});

el.newPassword.addEventListener("keydown", (event) => {
  const debug = true;
  // event.preventDefault();
  // if (debug) console.log(`el.newPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key !== 'Enter') return;
  const masterPassword = el.masterPassword.value;
  const masterHash = createHash(masterPassword);
  const storedHash = localStorage.getItem("pwdHash");
  let msg;
  msg = `before Master Password change.`;
  msg = `${msg}\nmasterPassword: ${masterPassword}, masterHash: ${masterHash.slice(0,6)}...`;
  msg = `${msg}\nCRYPTO.passwd: ${CRYPTO.passwd},  storedHash: ${storedHash.slice(0,6)}...`;
  alert(msg);
  if (masterHash !== storedHash || masterPassword !== CRYPTO.passwd) {
    let m = "Incorrect Master Password!"
    if (debug) {
      m = `${m}\nstoredHash= ${storedHash.slice(0,6)}...`;
      m = `${m}\nmasterHash= ${masterHash.slice(0,6)}...`;
      m = `${m}\nmasterPassword= ${masterPassword}`;
      m = `${m}\nCRYPTO.passwd= ${CRYPTO.passwd}`;
    }
    alert(m);
    return;
  }
  const newPassword = el.newPassword.value;
  const newHash = createHash(newPassword);
  if (typeof(newPassword) !== 'string') {
    alert(`el.newPassword: ERROR: non-string: typeof(el.value)= ${typeof(newPassword)}`)
  }
  if (newPassword === masterPassword) {
    alert(`Master Password (=${masterPassword}) NOT changed`);
    return;
  }
  decryptLocalStorage(masterPassword, CRYPTO.encryptedItems);
  CRYPTO.passwd = newPassword;
  storageSet({key: "pwdHash", value: newHash, pwd: CRYPTO.passwd, encrypt: false, from: "el.newPassword"});
  localStorage.setItem("pwd", newPassword);
  encryptLocalStorage(newPassword, CRYPTO.encryptedItems);
  msg = `Master Password changed.`;
  msg = `${msg}\nold: ${masterPassword}, storedHash: ${storedHash.slice(0,6)}...`;
  msg = `${msg}\nnew: ${newPassword}, newHash: ${newHash.slice(0,6)}...`;
  msg = `${msg}\nCRYPTO.passwd: ${CRYPTO.passwd}`;
  alert(msg);
  alert(`after Master Password changed: localStorage= ${JSON.stringify(localStorage)}`);
  el.passwordContainer.style.display = "none";
});

// if (debug) console.log(`newPassword: storedHash= ${storedHash}`);
// if (debug) console.log(`newPassword: currentHash= ${currentHash}`);
    // // msg =  (newPassword !== CRYPTO.passwd) ? `${msg} changed.` : `${msg} NOT changed.`
    // if (debug) console.log(`newPassword: newPassword= ${newPassword}, CRYPTO.passwd= ${CRYPTO.passwd}`);
    // if (debug) console.log(`newPassword:1: msg= ${msg}`);
    // if (debug) alert(`el.newPassword: newPassword= ${newPassword}, CRYPTO.passwd= ${CRYPTO.passwd}`);
    // if (debug) console.log(`newPassword: new password= ${newPassword}`);
    // if (debug) console.log(`newPassword: new password hash= ${h}`);
    // if (debug) console.log(`newPassword: decrypted with CRYPTO.passwd= ${CRYPTO.passwd}`);
    // if (debug) console.log(`newPassword: decrypted with CRYPTO.key= ${CRYPTO.key}`);
    // if (debug) alert(`el.newPassword: before decrypt: CRYPTO.passwd= ${CRYPTO.passwd}`);
    // if (debug) console.log(`newPassword: encrypted with CRYPTO.passwd= ${CRYPTO.passwd}`);
    // if (debug) console.log(`newPassword: encrypted with CRYPTO.key= ${CRYPTO.key}`);
    // if (debug) console.log(`newPassword:2: msg= ${msg}`);
    // if (debug) console.log("newPassword: CRYPTO.passwd= ", CRYPTO.passwd);
    // if (debug) console.log("newPassword: CRYPTO.oldPassword= ", CRYPTO.oldPassword);
    // if (debug) {
    //   msg = `${msg}\nCRYPTO.passwd= ${CRYPTO.passwd}`;
    //   msg = `${msg}\npwdHash= ${storageGet({key: "pwdHash", pwd: CRYPTO.passwd, decrypt: false})}`;
    //   msg = `${msg}\nCRYPTO.key= ${CRYPTO.key}`;
    // }
    // if (debug) alert(`el.newPassword: before encrypt: newPassword= ${newPassword}, CRYPTO.passwd= ${CRYPTO.passwd}`);

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
  const debug = false;
  const pwdHash = createHash(CRYPTO.passwd);
  localStorage.setItem("pwdHash", pwdHash);
  localStorage.setItem("pwd", CRYPTO.passwd);
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
  opts.salt = get_random_string(16, charset);
  if (debug) console.log("setGenericOptions: opts= ", opts);
  if (debug) console.log("setGenericOptions: CRYPTO.passwd= ", CRYPTO.passwd);
  if (debug) alert(`setGenericOptions: CRYPTO.passwd= ${CRYPTO.passwd}`);
  storageSet({key: "options", value: opts, pwd: CRYPTO.passwd, from: "setGenericOptions"});
  storageSet({key: "encrypted", value: true, encrypt: false, from: "setGenericOptions"});
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
      CRYPTO.key = createKey(CRYPTO.passwd);
      const storedHash = storageGet({key: "pwdHash", pwd: CRYPTO.passwd, decrypt: false});
      const h = createHash(CRYPTO.passwd);
      storageSet({key: "pwdHash", value: h, encrypt: false, from: "serviceWorker"});
      localStorage.setItem("pwd", CRYPTO.passwd);
      if (debug) console.log("app: sw registered!", reg);
      if (debug) console.log("app: before createSplashScreen");
      if (debug) console.log("app: after createSplashScreen");
      if (debug) console.log(`app: storedHash= ${storedHash}`);
      if (debug) console.log(`app: CRYPTO.passwd= ${CRYPTO.passwd}`);
      if (debug) console.log(`app: new hash= ${h}`);
      if (debug) console.log(`app: CRYPTO.key= ${CRYPTO.key}`);
      if (debug) {
        let msg = `serviceWorker: storedHash= ${storedHash}\nnew hash= ${h}`;
        msg = `${msg}\nCRYPTO.passwd= ${CRYPTO.passwd}`;
        msg = `${msg}\nCRYPTO.key= ${CRYPTO.key}`;
        alert(msg);
      }
      let opts = storageGet({key: "options", pwd: CRYPTO.passwd, decrypt: true});
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

function handleExport(event, args) {
    // el.save.addEventListener("click", function () {
    const debug = false;
    const opts = { ...globalDefaults };
    if (debug) {
      console.log("handleExport: args.decrypted= ", args.decrypted);
      // console.log("handleExport: event.type= ", event.type);
      // console.log("handleExport: MINLENGTH=", MINLENGTH, " MAXLENGTH= ", MAXLENGTH);
      // return;
    }
    opts.pepper = el.pepper.value;
    opts.salt = el.salt.value;
    opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
    // setOptions(opts, CRYPTO.passwd);
    storageSet({key: "options", value: opts, pwd: CRYPTO.passwd, from: "handleExport"});
    el.length.value = Math.max(Math.min(opts.length, MAXLENGTH), MINLENGTH);
    if (debug) console.log("handleExport save: opts= ", opts);
    // showPopup("settings saved!", SHORTPOPUP);
    // if (kind === "decrypted") CRYPTO.enableDecryptedIO();
    if (CRYPTO.decryptedIOEnabled) alert("Plain text export!");
    exportLocalStorage({decrypted: args.decrypted});
    // CRYPTO.disableDecryptedIO();
    // document.querySelectorAll(".crypt").forEach(function(element) {
    //   element.classList.remove("glow");
    // });
};

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
        const args = {decrypted: false}
        console.log(".export: args= ", args); // Single click
        handleExport(event, args);
      }, timeDiffThreshold);
    } else {
      const args = {decrypted: true}
      console.log(".export: args= ", args);  // Double click
      handleExport(event, args);
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

document.getElementById("lock").addEventListener("click", function () {
  window.location.reload();
});

// el.reset.addEventListener("dblclick", function (event) {
//   const debug = false;
//   if (debug) console.log("Event listener triggered!"); // Should log when clicked
//   event.preventDefault(); // Add this line
//   if (debug) {
//     console.log("app: 2: reset: el= ", el);
//     console.log("app: 2: reset: globalDefaults= ", globalDefaults);
//   }
//   const opts = {};
//   opts.salt = el.salt.value = globalDefaults.salt;
//   opts.pepper = el.pepper.value = globalDefaults.pepper;
//   opts.length = el.length.value = globalDefaults.length;
//   if (debug) {
//     console.log("app: 2: reset: el.salt.value= ", el.salt.value);
//     console.log("app: 2: reset: el.pepper.value= ", el.pepper.value);
//     console.log("app: 2: reset: el.length.value= ", el.length.value);
//   }
//   storageSet({key: "options", value: globalDefaults, pwd: CRYPTO.passwd, from: "el.reset"});
//   showPopup("defaults restored!", SHORTPOPUP);
// });

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
    } else {
      alert('hint: opts undefined?!')
    }
  }, 0);
});

function matchingKeys(x, y) {
  const v = x.every(item => y.includes(item)) && y.every(item => x.includes(item));
  return v;
}

// arguments:
//    hint,
//          {salt: opts.salt, pepper: opts.pepper, length: opts.length});
function setHintOpts(hint, opts) {
  const debug = false;
  const q = matchingKeys(Object.keys(opts), Object.keys(globalDefaults));
  console.assert(q, "setHintsOpts: invalid keys: opts= ", opts);
  if (!q) {
    alert('setHintOpts: invalid keys opts!');
  }
  const x = storageGet({key: "options", pwd: CRYPTO.passwd, decrypt: true});
  const generic = (x === null) ? setGenericOptions() : x;
  if (debug) {
    console.log(`setHintOpts: generic=`, generic);
    console.log(`setHintOpts: opts=`, opts);
  }
  const diff = objDiff(opts, generic);
  if (debug) console.log(`setHintOpts: diff= `, diff);
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
    storageSet({key: "options", value: opts, pwd: CRYPTO.passwd, from: "setHintOpts"});
    return;
  }
  let sites = storageGet({key: "sites", pwd: CRYPTO.passwd, decrypt: true});
  if (debug) console.log(`setHintOpts: hint= ${hint}`);
  if (sites === null) {
    sites = {[hint]: diff};
    if (debug) console.log(`setHintOpts: sites was null, sites=`, sites);
  } else {
    sites[hint] = diff; // store ony values different from generic
    if (debug) console.log(`setHintOpts: sites was not null, sites=`, sites);
  }
  storageSet({key: "sites", value: sites, pwd: CRYPTO.passwd, from: "setHintOpts"});
}

// ...
function getHintOpts(hint) {
  const debug = false;
  // alert(`getHintOpts: hint= ${hint}`)
  if (debug) console.log("getHintOpts: hint= ", hint)
  let opts = storageGet({key: "options", pwd: CRYPTO.passwd, decrypt: true});
  if (opts === null) {
    opts = {...globalDefaults};
    storageSet({key: "options", value: opts, pwd: CRYPTO.passwd, from: "getHintOpts"});
  }
  if (debug) console.log("getHintOpts: generic opts= ", opts);
  const sites = storageGet({key: "sites", pwd: CRYPTO.passwd, decrypt: true});
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
  setHintOpts(el.hint.value, opts);
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

// Function to export localStorage as a JSON file
// function exportLocalStorage(filename = "hpass-localStorage.json") {
function exportLocalStorage(args = {}) {
  args = {fileName: "hpass-localStorage.json", decrypted: false, ...args};
  const debug = false;
  if (debug) console.log(`exportLocalStorage: args.decrypted= ${args.decrypted}`)
  // Convert settings object to JSON string
  // if (CRYPTO.decryptedIOEnabled) {
  if (args.decrypted) {
    alert("Plain text export!");
    decryptLocalStorage(CRYPTO.passwd, CRYPTO.encryptedItems);
  } else {
    alert("Double Click for decrypted (plain text) export!");
  }
  const x = JSON.stringify(localStorage, null, 2);
  const blob = new Blob([x], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = args.fileName;
  link.href = window.URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // if (CRYPTO.decryptedIOEnabled) {
  if (args.decrypted) encryptLocalStorage(CRYPTO.passwd, CRYPTO.encryptedItems);
}

// function foo(args = {}) {
//   args = {fileName: "hpass-localStorage.json", decrypted: false, ...args};
//   console.log('args= ', args)
// }

const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
document.body.querySelectorAll(".import").forEach(function(element) {
  const debug = false;
  if (debug) console.log(".import: selected");
  element.addEventListener("click", function() {
    if (debug) console.log(".import: clicked");
    el.fileInputModal.style.display = "block";
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
function importLocalStorage(event) {
  const debug = false;
  const file = el.importFileInput.files[0];
  if (debug) console.log("importLocalStorage: file=", file);
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          try {
              // Parse the JSON string from the file
              if (debug) console.log("importLocalStorage: e.target.result=", e.target.result);
              const importedLocalStorage = JSON.parse(e.target.result);
              localStorage.clear();
              for (let k in importedLocalStorage) {
                localStorage.setItem(k, importedLocalStorage[k]);
              }
              // const modal = document.getElementById("fileInputModal");
              el.fileInputModal.style.display = "none"; // TODO: modal is not defined
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

el.importFileInput.addEventListener('change', importLocalStorage);
