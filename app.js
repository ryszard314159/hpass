/*
TODO:
0 - use rcz: "start_url": "/hpass/"; main: "start_url": "/", - the same for scope
* - biometric https://stackoverflow.blog/2022/11/16/biometric-authentication-for-web-devs/
* - https://stripe.com for payments???
* promote hpass on: store.app, findpwa.com, pwastore.dev - some are rather dissfunctional!
1 - ML-KEM to replace CryptoJS https://www.npmjs.com/package/mlkem
2 - restore does not work for Secret
3 - If you need high-performance, high-security cryptography,
    you may want to consider native libraries or more modern JavaScript libraries
    like Web Cryptography API (W3C) :: https://www.w3.org/TR/WebCryptoAPI/
    or Forge.
4 - wipe pwd fields on lock!
5 - Another use case for env() variables is for desktop Progressive web apps (PWAs);
    try it: https://developer.mozilla.org/en-US/docs/Web/CSS/env
6 - how to store PASSWORD in-memory in serviceWorker
    if (navigator.serviceWorker.controller) {
      const msg = {type: "store-password", password: PASSWORD, tag: "app: setGenericOptions"};
      navigator.serviceWorker.controller.postMessage(msg);
    }
7 - <img id="editShare"...> does not show showPopup element.
8 - The Google Pay & Wallet Console lets you easily enable seamless payments
    on your apps and websites. Here’s your Merchant ID so you can complete your setup now.

*/

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

"use strict";

import { CHARS, getPass, get_random_string, objDiff, isEmpty,
         MINLENGTH, MAXLENGTH } from "./core/lib.js";
import { storageGet, storageSet, CRYPTO, sanityCheck,
         globalDefaults, hpassStorage } from "./core/lib.js";
import { decryptText, encryptText, createHash, verifyPassword} from "./core/crypto.js"

// const debug = 0;
let PASSWORD = null;
const SHORTPOPUP = 1e3; // short popup time
const URL = "https://hpass.app";

// Selecting elements
const el = {};
el.pgHint = document.getElementById("pgHint"); // to generate password
el.edHint = document.getElementById("edHint"); // to edit options and sites
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.back = document.getElementById("back");
el.burn = document.getElementById("burn");
el.editContainer = document.getElementById("editContainer");
el.peak = document.getElementById("peak"); // instead of top
el.range = document.getElementById("range");
el.gear = document.getElementById("gear");
el.generate = document.getElementById("generate");
el.entryContainer = document.getElementById("entryContainer");
el.masterPassword = document.getElementById("masterPassword");
el.newPassword = document.getElementById("newPassword");
el.changePassword = document.getElementById("changePassword");
el.hidesettings = document.getElementById("hidesettings");
el.settings = document.getElementById("settings");
el.help = document.getElementById("help");
el.info = document.getElementById("info");
el.storeButton = document.getElementById("storeButton");
el.reset = document.getElementById("reset");
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
el.save = document.getElementById("save");
el.fileInputModal = document.getElementById("fileInputModal");
el.importFileInput = document.getElementById('importFileInput');
el.install = document.querySelector(".btn.install");

//
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // Prevent the default prompt from showing
  deferredPrompt = event;
  // Show your custom install button
  el.install.style.display = "block";
});

// When the install button is clicked:
el.install.addEventListener('click', () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // Show the install prompt
    deferredPrompt = null; // Reset the variable
    el.install.style.display = "none";
  }
});

//

window.onload = function() {
  // alert(`PAGE LOADED! PASSWORD= ${PASSWORD}`);
  window.scrollTo(0, 0);
}

document.querySelectorAll(".password-container span").forEach( function(element) {
  element.addEventListener('click', () => togglePassword(element));
});

function togglePassword(element) {
  const input = element.parentElement.querySelector('input');
  if (input.type === 'password') {
    input.type = 'text';
    element.innerHTML = '<img class="eye-img" src="icons/eye-show.svg">';
  } else {
    input.type = 'password';
    element.innerHTML = '<img class="eye-img" src="icons/eye-hide.svg">';
  }
}

el.gear.addEventListener('click', async function () {
  const opts = await storageGet({key: "options", pwd: PASSWORD});
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  el.editContainer.style.display = "block";
  // el.editContainer.style.zIndex = 99;
  // //
  // const nonWhitespaceHeight = Array.from(el.editContainer.children).reduce((acc, child) => {
  //   const rect = child.getBoundingClientRect();
  //   const height = rect.bottom - rect.top;
  //   return acc + height;
  // }, 0);
  // const viewportHeight = window.innerHeight;
  // const occupancyPercentageNonWhitespace = (nonWhitespaceHeight / viewportHeight) * 100;
  // console.log(`Non-whitespace content occupies ${occupancyPercentageNonWhitespace}% of the viewport height.`);
  // //
  // el.adunit.style.top = `${occupancyPercentageNonWhitespace + 2}%`;
  // el.adunit.style.display = "none";
});

// el.back.addEventListener('click', function () {
//   el.editContainer.style.display = "none";
//   el.adunit.style.top = "50%";
//   el.adunit.style.display = "block";
// });

document.querySelector(".btn.back").addEventListener('click', function () {
  el.editContainer.style.display = "none";
  el.adunit.style.top = "50%";
  el.adunit.style.display = "block";
});

function noIdlingHere() { // TODO: should this be activated?
  const debug = true;
  function yourFunction() {
      // alert('inactive!');
      const secretInputs = document.querySelectorAll('.secret');
      secretInputs.forEach((input) => {
        input.value = '';
        // Remove associated storage (if applicable)
        localStorage.removeItem(input.name);
        // sessionStorage.removeItem(input.name);
      });
      el.entryContainer.style.display = "block";
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

// show/hide newPassword field by clicking on change button
document.querySelector(".btn.change").addEventListener("click", function() {
  document.getElementById("newPasswordDiv").classList.toggle("show");
});

// Hide newPassword on click outside
document.addEventListener("click", (event) => {
  if (!event.target.closest("#newPassword") &&
      !event.target.closest(".btn.change") &&
      !event.target.closest(".eye-img") &&
      !event.target.closest("#masterPassword")
    ) {
      document.getElementById("newPasswordDiv").classList.remove("show");
  }
});

el.masterPassword.addEventListener("keydown", async function(event) {
  const debug = false;
  if (debug) console.log(`el.masterPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === "Enter") {
    event.preventDefault(); // NOTE: to make <form> wrapper work for <input>
    if (debug) console.log('masterPssword: Enter key pressed!');
    // alert("masterPssword: Enter key pressed!");
    // setTimeout( async () => {
      const storedHash = localStorage.getItem("pwdHash");
      if (storedHash === null) {
        alert("Password Hash was null.\nAll settings removed & Master Password set to empty string");
        localStorage.clear();
        PASSWORD = '';
        // sessionStorage.setItem("password", PASSWORD);
        const hash = await createHash(PASSWORD);
        hpassStorage.setItem("pwdHash", hash, `el.masterPassword: pwd=''`);
        return;
      }
      const pwd = el.masterPassword.value;
      // alert("masterPssword: before verifyPassword");
      const isCorrect = await verifyPassword(storedHash, pwd);
      // alert(`masterPssword: after verifyPassword: isCorrect= ${isCorrect}`);
      if (isCorrect) {
        PASSWORD = pwd;
        // sessionStorage.setItem("password", pwd);
        el.entryContainer.style.display = "none";
        window.sessionStorage.setItem("entryContainerHidden", true);
        window.scrollTo(0, 0); // scroll window to the top!
      } else {
        if (debug) console.log(`masterPassword: >>${pwd}<< Wrong password - try again!`);
        if (debug) console.log(`masterPassword: storedHash= ${storedHash}`);
        alert(`>>${pwd}<< Wrong password - try again!`)
      }
    // }, 0);
  }
});

el.newPassword.addEventListener("keydown", async (event) => {
  const debug = false;
  if (event.key !== 'Enter') return;
  event.preventDefault(); // NOTE: to make <form> wrapper work for <input>
  function _cleanup() {
    el.newPassword.value = '';
    el.masterPassword.value = '';
    el.entryContainer.style.display = "none";
    el.newPassword.classList.toggle("show");
  }
  const masterPassword = el.masterPassword.value;
  const newPassword = el.newPassword.value;
  if (newPassword === masterPassword) {
    alert(`Master and New Password fields are the same.`)
    _cleanup();
    return;
  }

  const storedHash = localStorage.getItem("pwdHash");
  const isCorrect = await verifyPassword(storedHash, masterPassword);
  if (debug) console.log(`masterPassword= ${masterPassword}, verified= ${verified}, storedHash= ${storedHash}`)
  // const sessionPassword = sessionStorage.getItem("password");
  // if (PASSWORD !== sessionPassword) {
  //   const msg = `ERROR: app: PASSWORD= ${PASSWORD}, sessionPassword= ${sessionPassword}`;
  //   alert(msg);
  //   console.log(msg);
  //   throw new Error(msg);
  //   PASSWORD = sessionPassword;
  // }
  // if (!isCorrect || masterPassword !== PASSWORD) {
  if (!isCorrect) {
    let msg = "Incorrect Master Password - try again."
    if (debug) {
      msg = `${msg}\nstoredHash= ${storedHash.slice(0,9)}...`;
      msg = `${msg}\nmasterPassword= ${masterPassword}`;
      msg = `${msg}\nPASSWORD= ${PASSWORD}`;
    }
    alert(msg);
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
  hpassStorage.setItem("pwdHash", pwdHash, `el.newPassword:`);
  PASSWORD = newPassword;
  // sessionStorage.setItem("password", newPassword);

  // change encryption from old to new password
  try {
    for (const key of CRYPTO.encryptedItems) {
      const fromStorage = localStorage.getItem(key);
      if (fromStorage === null) continue;
      const decrypted = await decryptText(masterPassword, fromStorage);
      const encrypted = await encryptText(newPassword, decrypted);
      hpassStorage.setItem(key, encrypted);
      console.log(`newPassword: ${newPassword}, masterPassword= ${masterPassword}`)
    }
  } catch (error) {
    console.error("Error updating encrypted items:", error);
  }

  _cleanup();
  return;
});

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
  PASSWORD = '';
  // sessionStorage.setItem("password", '');
  storageSet({key: "options", value: opts, pwd: PASSWORD, debug: true}).then( () => {
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

async function createSplashScreen(opts) {
  const debug = false;
  if (debug) console.log("createSplashScreen: at the START");
  if (debug) console.trace();
  PASSWORD = '';
  // sessionStorage.setItem("password", PASSWORD);
  const pwdHash = await createHash(PASSWORD);
  localStorage.setItem("pwdHash", pwdHash);
  const changeImg = `<img src="icons/change.svg" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></img>`;
  const helpImg = `<img src="icons/help.svg" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></img>`;
  const infoImg = `<img src="icons/info.svg" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></img>`;
  let msg = `<h3>New in ${el.version.innerHTML}:</h3>
  <ul>
    <li>Added install button.
  </ul>
  <h3>To start using HPASS:</h3>
  <ol>
  <li>Close this menu.
  <li>Password is initially blank. This
  <a href="https://www.pcmag.com/how-to/tricks-for-remembering-strong-passwords">PC article</a>
  is a good starting guide how to create strong and memorable passwords.
  <li>Change (${changeImg}) Password.
  </ol>
  <hr style="color: black;">
  <div>
  <br>
  <p style="background-color: yellow;">Store Password in a safe location.</p>
  <br>
  All settings are stored encrypted on your local device using
  Password as the encryption key.

  </div>
  `;
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
    // window.location.href = 'help.html';
  });
  content.appendChild(closeButton);
  container.appendChild(content);
  container.style.display = "block";
  document.body.appendChild(container);
  if (debug) console.log("createSplashScreen: at the end");
  if (debug) console.trace();
}

if ("serviceWorker" in navigator) {
  const debug = false;
  if (debug) console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
  .register("sw.js", { scope: './' })
  .then((reg) => {
    // alert(`app: register: PASSWORD= ${PASSWORD}`);
    let opts = localStorage.getItem("options");
    if (opts === null) {
      if (debug) console.log("app: register: null options in localStorage!");
      opts = setGenericOptions();
      if (debug) console.log("app: register: set to generic: opts= ", opts);
    } else {
      if (debug) console.log("app: register: exist already: opts= ", opts);
    }
    if (debug) console.log("app: register: globalDefaults= ", globalDefaults);
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
  const debug = true;
  if (debug) console.log("app: message: event= ", event);
  if (event.data && event.data.type === "VERSION") {
    if (debug) console.log("app: message: event.data= ", event.data);
    // document.getElementById("version").version.innerHTML = `${event.data.version}`;
    el.version.innerHTML = `${event.data.version}`;
  }
});

/**
 * Copy a string to clipboard
 * @param  {String} string         The string to be copied to clipboard
 * @return {Boolean}               returns a boolean correspondent to the success of the copy operation.
 * @see https://stackoverflow.com/a/53951634/938822
 */
// function deprecated_copyToClipboard(string) {
//   let textarea;
//   let result;

//   try {
//     textarea = document.createElement("textarea");
//     textarea.setAttribute("readonly", true);
//     textarea.setAttribute("contenteditable", true);
//     textarea.style.position = "fixed"; // prevent scroll from jumping to the bottom when focus is set.
//     textarea.value = string;
//     document.body.appendChild(textarea);
//     textarea.focus();
//     textarea.select();
//     const range = document.createRange();
//     range.selectNodeContents(textarea);
//     const sel = window.getSelection();
//     sel.removeAllRanges();
//     sel.addRange(range);
//     textarea.setSelectionRange(0, textarea.value.length);
//     result = document.execCommand("copy");
//   } catch (err) {
//     console.error(err);
//     result = null;
//   } finally {
//     document.body.removeChild(textarea);
//   }
//   // manual copy fallback using prompt
//   if (!result) {
//     // const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
//     const isMac = await navigator.userAgentData.platform.includes("mac");
//     const copyHotkey = isMac ? "⌘C" : "CTRL+C";
//     result = prompt(`Press ${copyHotkey}`, string); // eslint-disable-line no-alert
//     if (!result) {
//       return false;
//     }
//   }
//   return true;
// }

/**
 * Copy a string to clipboard
 * @param  {String} string     The string to be copied to clipboard
 * @return {Boolean}           returns a boolean correspondent to the success of the copy operation.
 */
async function copyToClipboard(string) {
  try {
    await navigator.clipboard.writeText(string);
    return true;
  } catch (err) {
    console.error(err);
    // manual copy fallback using prompt
    const isMac = navigator.userAgent.toUpperCase().includes("MAC");
    const copyHotkey = isMac ? "⌘C" : "CTRL+C";
    const result = prompt(`Press ${copyHotkey} to copy:`, string);
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
  const popupStyles = {
    display: 'block',
    position: 'fixed',
    fontSize: '1.1rem',
    backgroundColor: bkg,
    border: '0.1px solid black',
    zIndex: 9,
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -100%)',
    width: '90%',
    textAlign: 'center',
    borderRadius: '15px',
    padding: '1rem 0 1rem 0',
    overflow: 'auto',
    boxShadow: '4pt 4pt 4pt grey'
  };
  const buttonStyles = {
    fontSize: '1rem',
    position: 'absolute',
    top: '0.2rem',
    right: '0.8rem',
    backgroundColor: 'transparent',
    border: '0px solid black'
  };
  const popup = document.createElement("div");
  popup.id = "showPopup";
  const closeButton = document.createElement("button");
  // popup.style = popupStyles;
  // closeButton.style = buttonStyles;
  Object.assign(popup.style, popupStyles);
  Object.assign(closeButton.style, buttonStyles);
  popup.setAttribute('role', 'alert');
  popup.setAttribute('aria-live', 'assertive');
  closeButton.setAttribute('aria-label', 'Close popup');
  popup.innerHTML = `<br>${msg}`;
  closeButton.innerHTML = "⨉";
  popup.appendChild(closeButton);
  document.documentElement.appendChild(popup);
  popup.addEventListener('click', (e) => {
    if (e.target === closeButton) {
      popup.remove();
    }
  });
  console.log("showPopup: before setTimeout");
  // timeOut = 1000; // for debugging only!
  setTimeout(() => popup.remove(), timeOut);
}

document.querySelectorAll(".reset").forEach(function(element) {
  element.addEventListener("click", async function (event) {
    const debug = false;
    if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
    let msg = `WARNING: all existing settings will be removed!`;
    msg = `${msg}\nPassword will be reset to default (empty string) value.`;
    msg = `${msg}\n\nClick OK to proceed.`
    if (confirm(msg)) {
      event.preventDefault();
      // localStorage.removeItem("options");
      // localStorage.removeItem("sites");
      // localStorage.removeItem("history");
      localStorage.clear();
      PASSWORD = '';
      // sessionStorage.setItem("password", PASSWORD);
      const pwdHash = await createHash(PASSWORD);
      hpassStorage.setItem("pwdHash", pwdHash, `edit: reset: pwdHash= ${pwdHash}`)
      const opts = setGenericOptions();
    }
  });
});

// document.getElementById("logop").addEventListener("click", function () {
//   copyToClipboard(URL);
//   showPopup(`${URL}<br>copied to clipoard - share it! `, 9 * SHORTPOPUP);
// });

// text: "Simple and easy tool to generate and use strong and unique passwords.\n\
// I found it useful - you may find it useful too.",

document.querySelectorAll(".share").forEach(function(element) {
  console.log("INFO: .share selected");
  element.addEventListener("click", async function (event) {
    console.log("INFO: .share clicked");
    const shareData = {
      title: "HPASS Password Generator",
      text: `Simple and easy tool for generating and using strong and unique passwords.\
    \nVisit ${URL} to check it out!`,
    };
    if (!navigator.canShare) {
      copyToClipboard(`${shareData.title}: ${shareData.text}`);
      showPopup(`Message about HPASS copied to Clipboard - share it! `, 3 * SHORTPOPUP);
    } else {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error(`ERROR: .share err= ${err}`);
      }
    }
  });
});

document.querySelectorAll(".lock").forEach(function(element) {
  element.addEventListener("click", function (event) {
    const lock = document.getElementById("lockSound");
    if (el.masterPassword && el.entryContainer && lockSound) {
      el.masterPassword.value = "";
      el.entryContainer.style.display = "block";
      el.editContainer.style.display = "none";
      // el.entryContainer.style.visibility = "visible";
      // el.editContainer.style.visibility = "hidden";
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

async function generateFun(event) {
  const debug = false;
  event.preventDefault();
  if (debug) console.log("generateFun: event.preventDefault() added");
  let opts = await storageGet({key: "options", pwd: PASSWORD});
  const pgHint = el.pgHint.value;
  if (pgHint !== "undefined") {
    const sites = await storageGet({key: "sites", pwd: PASSWORD});
    if (sites !== null) {
      if (sites[pgHint] !== "undefined") {
        opts = {...opts, ...sites[pgHint]};
      }
    }
  }
  if (debug) console.log("generateFun:0: opts= ", opts);
  let args = { ...opts };
  args.burn = el.burn.value;
  args.peak = el.peak.value;
  el.burn.value = '';
  el.peak.value = '';
  args.hint = el.pgHint.value;
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

function handleFeedback() {
  const debug = false;
  if (navigator.vibrate) {   // haptic
      navigator.vibrate(50); // vibrate for 100ms
  }
  if (el.clickSound) { // Ensure the audio is ready to play
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

el.pgHint.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    generateFun(event);
  }
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

function validLength(x, minLen = MINLENGTH, maxLen = MAXLENGTH) {
  if (typeof(x) !== 'string') return false;
  const n = parseInt(x);
  const v = n.toString() !== x  || n < minLen || maxLen < n;
  return !v;
}

async function saveOptions(args) {
  const stringEmpty = (x) => x === '';
  const objEmpty = (x) => Object.keys(x).length === 0;
  const objEqual = (x, y) => objEmpty(objDiff(x, y));
  // let currentOpts = null;
  // let updateCurrentOpts = () => currentOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  // updateCurrentOpts();
  let hint = el.edHint.value;
  const storedOpts = await storageGet({key: "options", pwd: PASSWORD});
  if (storedOpts === null) {
    const msg = `saveOptions: ERROR: problem decrypting stored options`;
    alert(msg);
    throw new Error(msg);
  }

  let sites = localStorage.getItem("sites");
  if (sites !== null) {
    sites = await storageGet({key: "sites", pwd: PASSWORD});// decrypt: true is the default!
    if (sites === null) {
      alert(`saveOptions: ERROR: cannot decrypt sites!`);
      throw new Error(`saveOptions: ERROR: cannot decrypt sites!`);
    }
  } else {
    sites = {};
  }
  const storedHintValues = sites[hint];

  const currentOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  if (!validLength(el.length.value)) {
    alert(`Length must be an integer in ${MINLENGTH}-${MAXLENGTH} range`);
    el.length.value = storedHintValues && storedHintValues.length
                      ? storedHintValues.length : storedOpts.length
    return;
  }

  const diff = objDiff(currentOpts, storedOpts);
  const empty = stringEmpty(hint);
  const equal = objEmpty(diff);
  const undef = storedHintValues === undefined;
  const state = [empty, equal, undef].map(x => +x).join('');
  // "000": "Hint Field is NOT empty, current != stored, storedHint is defined",
  // "001": "Hint Field is NOT empty, current != stored, storedHint is undefined",
  // "010": "Hint Field is NOT empty, current == stored, storedHint is defined",
  // "011": "Hint Field is NOT empty, current == stored, storedHint is undefined",
  // "100": "Hint Field is empty,     current != stored, storedHint is defined",
  // "101": "Hint Field is empty,     current != stored, storedHint is undefined",
  // "110": "Hint Field is empty,     current == stored, storedHint is defined",
  // "111": "Hint Field is empty,     current == stored, storedHint is undefined",
  const messages = {
    "000": `Replace site-specific settings for >>${hint}<<`,    // A
    "001": `Create New site-specific settings for >>${hint}<<`, // B
    "010": `Restore generic settings for >>${hint}<<`,          // C
    "011": `Nothing new to save`,                               // D
    "100": "New generic settings",                              // E
    "101": "New generic settings",                              // E
    "110": "Nothing new to save",                               // D
    "111": "Nothing new to save",                               // D
  }
  let msg = messages[state];
  //
  // "000": `Replace site-specific settings for >>${hint}<<`,    // A
  // "000": "Hint Field is NOT empty, current != stored, storedHint is defined",
  //
  if (state === "000") {
    const hs = {...currentOpts, ...sites[hint]};
    const remove = objEqual(hs, storedOpts); //
    const doNothing = objEqual(hs, currentOpts); //
    if (remove) {
      msg = `Remove site-specific settings for >>${hint}<<`;
    } else if (doNothing) {
      msg = `Nothing new for >>${hint}<<`;
      alert(msg);
      return;
    } else {
      // updateCurrentOpts();
      const rep = {...sites[hint], ...currentOpts};
      msg = `Replace site-specific settings for >>${hint}<<`
      msg = `${msg}\nSecret= ${rep.salt}`;
      msg = `${msg}\nSpecial Character= ${rep.pepper}`;
      msg = `${msg}\nLength= ${rep.length}`;
      sites[hint] = objDiff(rep, storedOpts);
    }
    msg = `${msg}\nDo you want to proceed?`;
    // msg = `state= ${state}\n${msg}\n`;
    if (confirm(msg)) {
      if (remove) {
        delete sites[hint];
        if (objEmpty(sites)) localStorage.removeItem("sites");
        alert("Removed!");
      } else {
        alert("Saved!");   
      }
      if (!objEmpty(sites)) {
        await storageSet({key: "sites", value: sites, pwd: PASSWORD});
      }
    }
    return;
  }
  // "001": "Hint Field is NOT empty, current != stored, storedHint is undefined",
  // "001": `Create New site-specific settings for >>${hint}<<`, // B
  if (state === "001") {
    sites[hint] = diff;
    // msg = `state= ${state}\n${msg}\n`;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    msg = `${msg}\nDo you want to save them?`;
    if (confirm(msg)) {
      await storageSet({key: "sites", value: sites, pwd: PASSWORD});
      alert("Saved!");
    } else {
      el.salt.value = storedOpts.salt;
      el.pepper.value = storedOpts.pepper;
      el.length.value = storedOpts.length;      
    }
    return;
  }
  //
  // "010": "Hint Field is NOT empty, current == stored, storedHint is defined",
  // "010": `Restore generic settings for >>${hint}<<`,          // C
  //
  if (state === "010") {
    // msg = `state= ${state}\n${msg}\n`;
    if (confirm(msg)) {
      delete sites[hint];
      if (objEmpty(sites)) {
        localStorage.removeItem("sites");
      } else {
        await storageSet({key: "sites", value: sites, pwd: PASSWORD});
      }
      alert(`Generic settings restored for >>${hint}<<`);
    } else {
      const x = {...currentOpts, ...sites[hint]};
      el.salt.value = x.salt;
      el.pepper.value = x.pepper;
      el.length.value = x.length;
    }
    return;
  }
  //
  // "011": "Hint Field is NOT empty, current == stored, storedHint is defined",
  // "110": "Hint Field is empty,     current == stored, storedHint is defined",
  // "111": "Hint Field is empty,     current == stored, storedHint is undefined",
  // "011": `Nothing new to save`,                               // D
  // "110": "Nothing new to save",                               // D
  // "111": "Nothing new to save",                               // D
  //
  if (state === "011" || state === "110" || state === "111") {
    // msg = `state= ${state}\n${msg}\n`;
    alert(msg);
    return;
  }
  //
  // D: New generic settings
  // "100": "Hint Field is empty,     current != stored, storedHint is undefined",
  // "101": "Hint Field is empty,     current != stored, storedHint is defined",
  //
  if (state === "100" || state === "101") {
    if (!validLength(currentOpts.length)) {
      const msg = "ERROR: invalid Length parameter\nMust be an integer in 4-128 range";
      alert(msg);
      return;
    }
    // msg = `state= ${state}\n${msg}\n`;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    if (confirm(msg)) {
      await storageSet({key: "options", value: currentOpts, pwd: PASSWORD});
      alert("Saved!");
    } else {
      el.salt.value = storedOpts.salt;
      el.pepper.value = storedOpts.pepper;
      el.length.value = storedOpts.length;
    }
    return;
  }
}

el.save.addEventListener("click", saveOptions);

async function defunct_saveOptions(args) {
  args = {debug: -1, ...args};
  const debug = args.debug;
  let msg;
  let currentOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  let hint = el.edHint.value;
  const storedOpts = await storageGet({key: "options", pwd: PASSWORD});
  if (storedOpts === null) {
    const msg = `saveOptions: ERROR: problem decrypting stored options`;
    alert(msg);
    throw new Error(msg);
  }
  const diff = objDiff(currentOpts, storedOpts);
  if (hint === '' && Object.keys(diff).length === 0) {
    msg = `Stored generic settings are the same.\nNothing to save.`
    alert(msg);
    console.log(`saveOptions: ${msg}`);
    return;
  }
  if (hint === '' && Object.keys(diff).length !== 0) {
    msg = `New generic settings:\n`;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    if (confirm(msg)) {
      await storageSet({key: "options", value: currentOpts, pwd: PASSWORD});
      alert("Saved!");
    } else {
      el.salt.value = storedOpts.salt;
      el.pepper.value = storedOpts.pepper;
      el.length.value = storedOpts.length;
    }
    return;
  }
  // hint !== ''
  // if (Object.keys(diff).length === 0) {
  //   alert(`Nothing site-specific to save for ${hint}`)
  //   return;
  // }
  let sites = localStorage.getItem("sites");
  if (sites !== null) {
    sites = await storageGet({key: "sites", pwd: PASSWORD});// decrypt: true is the default!
    if (sites === null) {
      alert(`saveOptions: ERROR: cannot decrypt sites!`);
      throw new Error(`saveOptions: ERROR: cannot decrypt sites!`);
    }
  } else {
    sites = {};
  }
  const storedHintValues = sites[hint];
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
  const hintDiff = (storedHintValues !== undefined) ? objDiff(sites[hint], storedHintValues) : sites[hint];
  // if (Object.keys(hintDiff).length === 0) {
  //   alert(`Nothing new for ${hint}`);
  //   return;
  // }
  if (isEmpty(hintDiff) && storedHintValues === undefined) {
    alert(`Nothing new for ${hint}`);
    return;
  }
  if (isEmpty(hintDiff) && storedHintValues !== undefined) {
    const toStore = {...storedOpts, ...currentOpts};
    replacedOrCreated = "restored to default values"
  }
  msg = `Hint-specific settings ${replacedOrCreated}:\n`;
  msg = `${msg}\nHint= ${hint}`;
  const hs = {...currentOpts, ...sites[hint]};
  msg = `${msg}\nSecret= ${hs.salt}`;
  msg = `${msg}\nSpecial Character= ${hs.pepper}`;
  msg = `${msg}\nLength= ${hs.length}`;
  msg = `${msg}\nDo you want to save them?`;
  if (confirm(msg)) {
    if (isEmpty(sites[hint])) { delete sites[hint]};
    if (isEmpty(sites)) {
      localStorage.removeItem('sites');
      alert("Hint-specific settings removed!");
    } else {
      await storageSet({key: "sites", value: sites, pwd: PASSWORD});
      alert("Saved!");
    }
  }
}

el.edHint.addEventListener('input', async function(event) {
  const storedSites = await storageGet({key: "sites", pwd: PASSWORD});
  if (storedSites === null) return;
  let hopt = storedSites[el.edHint.value];
  const opts = await storageGet({key: "options", pwd: PASSWORD});
  const x = (hopt === undefined) ? opts : {...opts, ...hopt};
  el.salt.value = x.salt;
  el.pepper.value = x.pepper;
  el.length.value = x.length;
});

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
        handleExport({encrypted: true}); // Single click
      }, timeDiffThreshold);
    } else {
      handleExport({encrypted: false}); // Double click
    }
  });
});

function handleExport(args = {}) {
  args = {fileName: "hpass-settings", encrypted: true, ...args};
  const keys = ["encrypted", "sites", "options", "pwdHash"];
  const toExport = {}; // prepare localStorage copy for export
  // Object.keys(localStorage).forEach ((key) => {toExport[key] = localStorage.getItem(key)});
  keys.forEach ((key) => {
    const x = localStorage.getItem(key);
    if (x !== null) toExport[key] = x;
  });
  toExport.encrypted = args.encrypted;

  // console.log(`DEBUG: handleExport: toExport= ${JSON.stringify(toExport)}`);

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
  
  if (!args.encrypted) {
    if (!confirm("Plain text export!")) return;
    // const sessionPassword = sessionStorage.getItem("password");
    // if (PASSWORD !== sessionPassword) {
    //   alert(`ERROR: edit: handleExport: PASSWORD !== sessionPassword`);
    //   PASSWORD = sessionPassword;
    // }
    const decryptionPromises = CRYPTO.encryptedItems.map(async (key) => {
      if (toExport[key] === undefined) return;
      toExport[key] = await decryptText(PASSWORD, toExport[key]);
    });
    Promise.all(decryptionPromises).then(() => {
      finish();
    });
  } else {
    if (!confirm("Encrypted export\nDouble Click for decrypted (plain text) export!")) return;
    finish();
  }
}

document.body.querySelectorAll(".import").forEach(function(element) {
  const debug = false;
  if (debug) console.log(".import: selected");
  element.addEventListener("click", function() {
    if (debug) console.log(".import: clicked");
    el.fileInputModal.style.display = "block";
    el.fileInputModal.style.zIndex = "99";
  });
});

el.importFileInput.addEventListener('change', handleImport);
async function handleImport(event) {
  const debug = false;
  el.edHint.value = '';
  const file = el.importFileInput.files[0];
  const fileName = el.importFileInput.value;
  if (debug) console.log("handleImport: file=", file);
  if (file) {
      const tmpStorage = {};
      const reader = new FileReader();
      reader.onload = async function(e) {
          try {
              // Parse the JSON string from the file
              if (debug) console.log("handleImport: e.target.result=", e.target.result);
              const imp = JSON.parse(e.target.result); // imported JSON file with settings
              if (debug) console.log("handleImport: imported= ", imp);
              if (debug) alert(`INFO: handleImport: e.target.result= ${e.target.result})}`)
              if (debug) alert(`INFO: handleImport: imp= ${JSON.stringify(imp)}`)
              // const backUp = JSON.stringify(localStorage);
              const isEncrypted = JSON.parse(imp["encrypted"]);
              if (isEncrypted) {
                const isCorrect = await verifyPassword(imp.pwdHash, PASSWORD);
                if (!isCorrect) {
                  alert(`ERROR: Master Password does not match password used for encryption`);
                  return;
                }
              }
              // should be ["options", "sites"] or ["options"]
              const common = Object.keys(imp).filter(key => CRYPTO.encryptedItems.includes(key));
              imp.options = isEncrypted ? await decryptText(PASSWORD, imp.options) : imp.options;
              if (imp.options === null) {
                alert(`ERROR: decryption failed`);
                return;
              }
              if (imp.sites !== undefined) {
                imp.sites = isEncrypted ? await decryptText(PASSWORD, imp.sites) : imp.sites;
              }
              common.forEach(async function(key) {
                imp[key] = await encryptText(PASSWORD, imp[key]);
                localStorage.setItem(key, imp[key]);
              });
              // Object.keys(imp).forEach(key => localStorage.setItem(key, imp[key]))
              localStorage.setItem("encrypted", true);
              setDisplayedOptions(imp.options);
              if (debug) alert(`INFO: handleImport: localStorage= ${JSON.stringify(localStorage)}`);
              // alert(`Settings imported from: ${fileName}`);
          } catch (error) {
              console.error('Error parsing JSON file:', error);
              alert('Failed to import settings. Please ensure the file is a valid JSON.');
          }
      };
      reader.readAsText(file);
      el.fileInputModal.style.display = "none";
      el.importFileInput.value = "";
      // await populateVisibleSettings();
      alert(`Settings imported from: ${fileName}`);
  } else {
      alert('No file selected.');
  }
}

// async function populateVisibleSettings() {
//   const storedOpts = await storageGet("options");
//   // const sites = await storageGet("sites");
//   el.salt.value = storedOpts.salt;
//   el.pepper.value = storedOpts.pepper;
//   el.length.value = storedOpts.length;
// }

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
