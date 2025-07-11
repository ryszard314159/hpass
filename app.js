"use strict";

import { VERSION, DEFAULT_SALT_LENGTH } from "./config.js";
import { CHARS, getPass, get_random_string, objDiff, isEmpty,
         MINLENGTH, MAXLENGTH } from "./core/lib.js";
import { storageGet, storageSet, CRYPTO, sanityCheck,
         globalDefaults, hpassStorage } from "./core/lib.js";
import { decryptText, encryptText, createHash, verifyPassword} from "./core/crypto.js"
import { register, authenticate } from "./webauthn.js";

function setPassword(pwd) {
  sessionStorage.setItem('PASSWORD', pwd);
};

function getPassword() {
  sessionStorage.getItem('PASSWORD');
};

const GLOBS = {};
let PASSWORD = null;
const SHORTPOPUP = 1e3; // short popup time
const URL = "https://hpass.app";

const el = {}
el.frontContainer = document.getElementById("frontContainer");
el.registerDialog = document.getElementById("registerDialog");
el.hintDialog = document.getElementById("hintDialog");
el.closeHintDialog = document.getElementById("closeHintDialog");
el.editDialog = document.getElementById("editDialog");
el.openEditDialog = document.getElementById("openEditDialog");
el.closeEditDialog = document.getElementById("closeEditDialog");
el.openImportDialog = document.getElementById("openImportDialog");
el.importDialog = document.getElementById("importDialog");
el.closeImportDialog = document.getElementById("closeImportDialog");
el.openResetDialog = document.querySelector(".btn.reset");
el.resetDialog = document.getElementById("resetDialog");
el.closeResetDialog = document.getElementById("closeResetDialog");
el.version = document.querySelectorAll(".version");
el.masterPassword = document.getElementById("masterPassword");
el.newPassword = document.getElementById("newPassword");
el.generate = document.querySelectorAll(".generate");
el.pgHint = document.getElementById("pgHint"); // to generate password
el.edHint = document.getElementById("edHint"); // to edit options and sites
el.burn = document.getElementById("burn"); // number of warmup rounds
el.peak = document.getElementById("peak"); // top secret
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.importFileInput = document.getElementById('importFileInput');
el.importPassword = document.getElementById('importPassword');
el.saveOptions = document.getElementById('saveOptions');
el.reset = document.getElementById("reset");
el.install = document.querySelector(".btn.install");

el.version.forEach(x => { x.innerHTML = VERSION;})

// TODO: test if this is needed
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
// Service worker section
//
if ("serviceWorker" in navigator) {
  const debug = false;
  if (debug) console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
  .register("sw.js", { scope: './', type: 'module' })
  .then((reg) => {
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

el.masterPassword.addEventListener("keydown", async function(event) {
  const debug = false;
  if (debug) console.log(`el.masterPassword: event key: ${event.key}, code: ${event.code}`);
  if (event.key === "Enter") {
    event.preventDefault(); // NOTE: to make <form> wrapper work for <input>
    if (debug) console.log('masterPssword: Enter key pressed!');
    const storedHash = localStorage.getItem("pwdHash");
    if (storedHash === null) {
      alert("Password Hash was null.\nAll settings removed & Master Password set to empty string");
      localStorage.clear();
      PASSWORD = '';
      const hash = await createHash(PASSWORD);
      hpassStorage.setItem("pwdHash", hash, `el.masterPassword: pwd=''`);
      return;
    }
    const pwd = el.masterPassword.value;
    const isCorrect = await verifyPassword(storedHash, pwd);
    if (isCorrect) {
      PASSWORD = pwd;
      GLOBS.options = await storageGet({key: "options", pwd: PASSWORD});
      GLOBS.sites = await storageGet({key: "sites", pwd: PASSWORD});
      el.frontContainer.style.display = "none";
      el.editDialog.style.display = "none";
      el.hintDialog.style.display = "block";
      window.sessionStorage.setItem("entryContainerHidden", true);
      window.scrollTo(0, 0);
    } else {
      if (debug) console.log(`masterPassword: >>${pwd}<< Wrong password - try again!`);
      if (debug) console.log(`masterPassword: storedHash= ${storedHash}`);
      alert(`>>${pwd}<< Wrong password - try again!`)
    }
  }
});

// show/hide newPassword field by clicking on change button
document.querySelector(".btn.change").addEventListener("click", function() {
  document.getElementById("newPasswordDiv").classList.toggle("show");
});

el.newPassword.addEventListener("keydown", async (event) => {
  const debug = false;
  if (event.key !== 'Enter') return;
  event.preventDefault(); // NOTE: to make <form> wrapper work for <input>
  function _cleanup() {
    el.newPassword.value = '';
    el.masterPassword.value = '';
    el.hintDialog.style.display = "block";
    el.editDialog.style.display = "none";
    el.frontContainer.style.display = "none";
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

el.closeHintDialog.addEventListener('click', () => {
  el.editDialog.style.display = "none";
  el.hintDialog.style.display = "none";
  el.frontContainer.style.display = "block";
});

el.openEditDialog.addEventListener('click', async () => {
  const opts = await storageGet({key: "options", pwd: PASSWORD});
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  el.editDialog.style.display = "block";
  el.hintDialog.style.display = "none";
  el.frontContainer.style.display = "none";
});

el.closeEditDialog.addEventListener("click", () => {
  el.editDialog.style.display = "none";
  el.frontContainer.style.display = "none";
  el.hintDialog.style.display = "block";
});

el.openImportDialog.addEventListener('click', () => {
  el.importDialog.showModal();
});

el.closeImportDialog.addEventListener("click", () => {
  el.importDialog.close();
});

el.closeResetDialog.addEventListener("click", () => {
  el.resetDialog.close();
});

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

el.importFileInput.addEventListener('change', handleImport);
async function handleImport(event) {
  const debug = false;
  el.edHint.value = '';
  const file = el.importFileInput.files[0];
  const fileName = el.importFileInput.value;
  let importPassword = el.importPassword.value;
  importPassword = importPassword !== PASSWORD ? importPassword : PASSWORD;
  if (debug) console.log("handleImport: file=", file);
  if (debug) console.log(`handleImport: importPassword= ${importPassword}`);
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
                const isCorrect = await verifyPassword(imp.pwdHash, importPassword);
                if (!isCorrect) {
                  alert(`ERROR: Password does not match password used for encryption`);
                  return;
                }
              }
              // should be ["options", "sites"] or ["options"]
              const common = Object.keys(imp).filter(key => CRYPTO.encryptedItems.includes(key));
              imp.options = isEncrypted ? await decryptText(importPassword, imp.options) : imp.options;
              if (imp.options === null) {
                alert(`ERROR: decryption failed`);
                return;
              }
              if (imp.sites !== undefined) {
                imp.sites = isEncrypted ? await decryptText(importPassword, imp.sites) : imp.sites;
              }
              common.forEach(async function(key) {
                imp[key] = await encryptText(PASSWORD, imp[key]);
                localStorage.setItem(key, imp[key]);
              });
              localStorage.setItem("encrypted", true);
              setDisplayedOptions(imp.options);
              if (debug) alert(`INFO: handleImport: localStorage= ${JSON.stringify(localStorage)}`);
          } catch (error) {
              console.error('Error parsing JSON file:', error);
              alert('Failed to import settings. Please ensure the file is a valid JSON.');
          }
      };
      reader.readAsText(file);
      el.importDialog.close();
      el.importFileInput.value = "";
      alert(`Settings imported from: ${fileName}`);
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

document.querySelectorAll(".password-container span").forEach( function(element) {
  element.addEventListener('click', () => togglePassword(element));
});

// toggle Password visibility
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

function generateFun(event, opts, sites) {
  const debug = false;
  event.preventDefault();
  if (debug) console.log("generateFun: event.preventDefault() added");
  // let opts = GLOBS.options;
  // let await_opts = await storageGet({key: "options", pwd: PASSWORD});
  const pgHint = el.pgHint.value;
  if (pgHint !== "undefined") {
    // const sites = GLOBS.sites;
    // const await_sites = await storageGet({key: "sites", pwd: PASSWORD});
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
  // copyToClipboard(passwd);
  navigator.clipboard.writeText(passwd);
  showPopup(`Generated password copied to clipboard:<br><br>${passwd}`, SHORTPOPUP);
}

function showPopup(msg, timeOut, bkg = "lightgreen") {
  const popupStyles = {
    position: 'absolute',
    fontSize: '1.1rem',
    backgroundColor: bkg,
    border: '0.1px solid black',
    margin: '33% auto',
    width: '90%',
    height: '25%',
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
  const popup = document.createElement("dialog");
  popup.id = "showPopup";
  const closeButton = document.createElement("button");
  Object.assign(popup.style, popupStyles);
  Object.assign(closeButton.style, buttonStyles);
  popup.setAttribute('role', 'alert');
  popup.setAttribute('aria-live', 'assertive');
  closeButton.setAttribute('aria-label', 'Close popup');
  popup.innerHTML = `<br>${msg}`;
  closeButton.innerHTML = "⨉";
  popup.appendChild(closeButton);
  document.documentElement.appendChild(popup);
  popup.showModal();
  popup.addEventListener('click', (e) => {
    if (e.target === closeButton) {
      popup.close();
    }
  });
  // console.log("showPopup: before setTimeout");
  // timeOut = 1000; // for debugging only!
  setTimeout(() => popup.close(), timeOut);
}

function handleFeedback(event) {
  const debug = false;
  const button = event.currentTarget;
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
  const animateClass = button.id === "generateRight" ? "animateGenerateRight" : "animateGenerateLeft";
  button.classList.add(animateClass);
  // Reset position after animation ends
  button.addEventListener('animationend', () => {
    // el.generate.style.animation = '';
    button.classList.remove(animateClass);
    button.style.left = '55%';
    button.style.transform = 'translateX(0%)';
  }, { once: true });
};

el.generate.forEach((button) => {
  button.addEventListener("click", handleFeedback)
  button.addEventListener("click", (event) => generateFun(event, GLOBS.options, GLOBS.sites));
});

el.pgHint.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    generateFun(event, GLOBS.options, GLOBS.sites);
  }
});

async function saveOptions() {
  const saved = {"sites": false, "options": false};
  const stringEmpty = (x) => x === '';
  const objEmpty = (x) => Object.keys(x).length === 0;
  const objEqual = (x, y) => objEmpty(objDiff(x, y));
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
    return saved;
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
      return saved;
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
      saved.sites = true;
    }
    return saved;
  }
  // "001": "Hint Field is NOT empty, current != stored, storedHint is undefined",
  // "001": `Create New site-specific settings for >>${hint}<<`, // B
  if (state === "001") {
    sites[hint] = diff;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    msg = `${msg}\nDo you want to save them?`;
    if (confirm(msg)) {
      await storageSet({key: "sites", value: sites, pwd: PASSWORD});
      alert("Saved!");
      saved.sites = true;
    } else {
      el.salt.value = storedOpts.salt;
      el.pepper.value = storedOpts.pepper;
      el.length.value = storedOpts.length;      
    }
    return saved;
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
      saved.sites = true;
    } else {
      const x = {...currentOpts, ...sites[hint]};
      el.salt.value = x.salt;
      el.pepper.value = x.pepper;
      el.length.value = x.length;
    }
    return sites;
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
    alert(msg);
    return saved;
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
      return saved;
    }
    // msg = `state= ${state}\n${msg}\n`;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    if (confirm(msg)) {
      await storageSet({key: "options", value: currentOpts, pwd: PASSWORD});
      alert("Saved!");
      saved.options = true;
    } else {
      el.salt.value = storedOpts.salt;
      el.pepper.value = storedOpts.pepper;
      el.length.value = storedOpts.length;
    }
    return saved;
  }
}

async function saveAndSetOptions() {
  console.log("before: GLOBS=", GLOBS);
  const saved = await saveOptions();
  if (saved.options) GLOBS.options = await storageGet({key: "options", pwd: PASSWORD});
  if (saved.sites) GLOBS.sites = await storageGet({key: "sites", pwd: PASSWORD});
  console.log("after: GLOBS=", GLOBS);
}

el.saveOptions.addEventListener("click", saveAndSetOptions);

function validLength(x, minLen = MINLENGTH, maxLen = MAXLENGTH) {
  if (typeof(x) !== 'string') return false;
  const n = parseInt(x);
  const v = n.toString() !== x  || n < minLen || maxLen < n;
  return !v;
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
  const toExport = {};
  keys.forEach ((key) => {
    const x = localStorage.getItem(key);
    if (x !== null) toExport[key] = x;
  });
  toExport.encrypted = args.encrypted;

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

document.querySelectorAll(".share").forEach(function(element) {
  element.addEventListener("click", async function (event) {
    console.log("INFO: .share clicked");
    const shareData = {
      title: "HPASS Password Generator",
      text: `Simple and easy tool for generating and using strong and unique passwords.\
    \nVisit ${URL} to check it out!`,
    };
    if (!navigator.canShare) {
      // copyToClipboard(`${shareData.title}: ${shareData.text}`);
      await navigator.clipboard.writeText(`${shareData.title}: ${shareData.text}`);
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

// button.addEventListener("click", () => {
//   const textPromise = fetchData().then((text) => new Blob([text], { type: "text/plain" }));
//   const item = new ClipboardItem({ "text/plain": textPromise });
//   navigator.clipboard.write([item]).catch(handleError);
// });

// use navigator.clipboard.write instead of navigator.clipboard.writeText
// in order to satisfy Safari...
function copyToClipboard(text) {
  try {
    const type = 'text/plain';
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    navigator.clipboard.write(data);
    console.log('Data copied to clipboard');
  } catch (error) {
    console.error('Failed to copy data: ', error);
  }
}

// async function copyToClipboard(string) {
//   try {
//     await navigator.clipboard.writeText(string);
//     return true;
//   } catch (err) {
//     console.error(err);
//     // manual copy fallback using prompt
//     const isMac = navigator.userAgent.toUpperCase().includes("MAC");
//     const copyHotkey = isMac ? "⌘C" : "CTRL+C";
//     const result = prompt(`Press ${copyHotkey} to copy:`, string);
//     if (!result) {
//       return false;
//     }
//   }
//   return true;
// }

document.querySelectorAll(".reset").forEach(function(element) {
  element.addEventListener("click", async function (event) {
    const debug = false;
    if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
    let msg = `WARNING: all existing settings will be removed!`;
    msg = `${msg}\nPassword will be reset to default (empty string) value.`;
    msg = `${msg}\n\nClick OK to proceed.`
    if (!confirm(msg)) return;
    event.preventDefault();
    const opts = await setGenericOptions();
  });
});

async function setGenericOptions() {
  const debug = false;
  if (debug) console.log("setGenericOptions: null options in localStorage!");
  let opts = {...globalDefaults};
  const charset = CHARS.digits + CHARS.lower + CHARS.upper;
  opts.salt = get_random_string(DEFAULT_SALT_LENGTH, charset);
  if (debug) console.log("setGenericOptions: opts= ", opts);
  if (debug) console.log("setGenericOptions: CRYPTO.passwd= ", CRYPTO.passwd);
  if (debug) alert(`setGenericOptions: CRYPTO.passwd= ${CRYPTO.passwd}`);
  localStorage.clear();
  PASSWORD = '';
  const pwdHash = await createHash(PASSWORD);
  localStorage.setItem("pwdHash", pwdHash);
  await storageSet({key: "options", value: opts, pwd: PASSWORD, debug: true})
  localStorage.setItem("encrypted", true);
  if (debug) console.log("setGenericOptions: before createSplashScreen: opts= ", opts);
  el.edHint.value = '';
  el.pgHint.value = '';
  el.hintDialog.style.display = "none";
  el.editDialog.style.display = "none";
  el.resetDialog.showModal()
  if (debug) console.log("setGenericOptions: returning opts= ", opts);
  return opts;
};

document.querySelectorAll(".lock").forEach(function(element) {
  element.addEventListener("click", function (event) {
    const lockSound = document.getElementById("lockSound");
    if (el.masterPassword && el.frontContainer && lockSound) {
      el.masterPassword.value = "";
      el.editDialog.style.display = "none";
      el.hintDialog.style.display = "none";
      lockSound.currentTime = 0; // Reset audio to start
      lockSound.volume = 0.1;
      lockSound.play();
    } else {
      console.error("Missing required elements.");
    }
  })
});

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

// Simulate registration (create credentials)
document.getElementById("register").addEventListener("click", async () => {
  // alert("Register!");
  if (!navigator.credentials || !navigator.credentials.create) {
    console.error("WebAuthn is not supported in this browser.");
    alert("WebAuthn is not supported in this browser.");
    return;
  }
  const created = await register({userName: "hpass.app", displayName: "hpass"});
  if (created) {
    alert("Passkey registered.");
  } else {
    alert("Passkey registration failed.")
  }
  el.registerDialog.close();
  // or prompt the user
  // await register();
  console.log(`Credential: created= ${created}`);
});

// Simulate authentication (retrieve credentials)
document.getElementById("authenticate").addEventListener("click", async () => {
  // alert("Autheticate!");
  if (!navigator.credentials || !navigator.credentials.get) {
    console.error("WebAuthn is not supported in this browser.");
    alert("WebAuthn is not supported in this browser.");
    return;
  }
  const isValid = await authenticate();
  if (isValid) {
    if (PASSWORD === null) {
      alert("Enter Password for extra security");
    } else {
      el.frontContainer.style.display = "none";
      el.hintDialog.style.display = "block";
      window.scrollTo(0, 0);
      console.log(`authenticate: PASSWORD= ${PASSWORD}`);
    }
  } else {
    console.log(`trying to authenticate: isValid= ${isValid}`);
    const cancel = document.getElementById("cancel");
    el.registerDialog.showModal();
    cancel.addEventListener('click', () => {
      el.registerDialog.close(); 
    });
  }
});

function noIdlingHere() { // TODO: should this be activated?
  const debug = true;
  const oneMinute = 60000;
  const idleTime = debug ? 1e9 : 10 * oneMinute;
  function yourFunction() {
      // alert(`Closing after ${idleTime/oneMinute} minutes of inactivity...`);
      const secretInputs = document.querySelectorAll('.secret');
      secretInputs.forEach((input) => {
        input.value = '';
        localStorage.removeItem(input.name);
      });
      el.frontContainer.style.display = "block";
      el.hintDialog.style.display = "none";
      el.editDialog.style.display = "none";
  }
  let t; // must be declared here
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
