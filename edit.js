"use strict";

import { CHARS, get_random_string, storageGet, storageSet, CRYPTO, objDiff,
         cleanUp, sanityCheck } from "./core/lib.js";
import { globalDefaults, hpassStorage } from "./core/lib.js";
import { createHash, decryptText, encryptText } from "./core/crypto.js"

const el = {};
el.hint = document.getElementById('hint');
el.salt = document.getElementById('salt');
el.pepper = document.getElementById('pepper');
el.length = document.getElementById('length');
el.save = document.getElementById('save');
el.fileInputModal = document.getElementById("fileInputModal");
el.importFileInput = document.getElementById('importFileInput');

//*** executable code ***/

window.onload = async function() {
  let opts = await storageGet({key: "options"});
  if (opts === null) {
    console.log(`edit: onload: opts == null`);
    console.log(`edit: localStorage.getItem("options")= ${localStorage.getItem("options")}`);
    console.log(`edit: onload: sessionPassword= ${sessionStorage.getItem("password")}`);
    alert("edit: opts === null");
  }
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  window.scrollTo(0, 0);
}



// document.querySelectorAll('.input').forEach(function(element) {
//   const opts = await storageGet({key: "options"})
//   element.addEventListener("click", function() {

//   })
// });

document.querySelector(".btn.edit").addEventListener("click", async function () {
  let opts = localStorage.getItem("options");
  if (opts === null) {
    window.location.href = 'index.html';
  }
  opts = await storageGet({key: "options"});
  if (opts === null) {
    opts = setGenericOptions();
    storageSet({key: "options"});
  }
  let hopt = {};
  if (el.hint.value !== '') {
    const storedSites = await storageGet({key: "sites"});
    if (storedSites !== "undefined") {
      const h = storedSites[el.hint.value];
      if (h !== "undefined") {
         hopt = h;
      }
    }
  }
  const x = {...opts, ...hopt};
  el.salt.value = x.salt;
  el.pepper.value = x.pepper;
  el.length.value = x.length;
});

el.save.addEventListener("click", saveOptions);
async function saveOptions(args) {
  args = {debug: -1, ...args};
  const debug = args.debug;
  let msg;
  let currentOpts = {salt: el.salt.value, pepper: el.pepper.value, length: el.length.value};
  let hint = el.hint.value;
  const storedOpts = await storageGet({key: "options"});
  const diff = objDiff(currentOpts, storedOpts);
  if (hint === '' && Object.keys(diff).length === 0) {
    msg = `NOTE: stored settings are the same! Nothing changed.`
    alert(msg);
    console.log(`saveOptions: ${msg}`);
    return;
  }
  // alert(`storeOptions: el.hint.value= ${el.hint.value}`);
  if (hint === '' && Object.keys(diff).length !== 0) {
    // msg = `NOTE: new generic settings saved: ${JSON.stringify(currentOpts)}`;
    msg = `New generic settings:\n`;
    msg = `${msg}\nSecret= ${currentOpts.salt}`;
    msg = `${msg}\nSpecial Character= ${currentOpts.pepper}`;
    msg = `${msg}\nLength= ${currentOpts.length}`;
    if (confirm(msg)) {
      await storageSet({key: "options", value: currentOpts});
      alert("Saved!");
    }
    return;
  }
  // hint !== ''
  let sites = await storageGet({key: "sites"});// decrypt: true is the default!
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
    msg = `Hint-specific settings ${replacedOrCreated}:\n`;
    msg = `${msg}\nHint= ${hint}`;
    // msg = `${msg}\nOld settings= ${JSON.stringify(storedHintValues)}`;
    // msg = `${msg}\nNew settings= ${JSON.stringify(sites[hint])}`;
    const hs = {...currentOpts, ...sites[hint]};
    msg = `${msg}\nSecret= ${hs.salt}`;
    msg = `${msg}\nSpecial Character= ${hs.pepper}`;
    msg = `${msg}\nLength= ${hs.length}`;
    msg = `${msg}\nDo you want to save them?`;
    if (confirm(msg)) {
      await storageSet({key: "sites", value: sites});
      alert("Saved!")
    }
  } else {
    delete localStorage.sites;
    alert(`All hint-specific settings removed!`);
  }
}

function toggleOptsReadOnly() {
  document.querySelectorAll('.edit').forEach(function(element) {
    element.readOnly = !element.readOnly;
  });
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

function handleExport(args = {}) {
  args = {fileName: "hpass-settings", decrypted: false, ...args};
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
    const password = sessionStorage.getItem("password");
    const decryptionPromises = CRYPTO.encryptedItems.map(async (key) => {
      if (toExport[key] === undefined) return;
      // console.log(`DEBUG: handleExport: toExport[${key}]= ${toExport[key]}`);
      toExport[key] = await decryptText(password, toExport[key]);
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
              const password = sessionStorage.getItem("password");
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
                        const decrypted = await decryptText(password, txt);
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
                  encryptText(password, txt).then( encrypted => {
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
