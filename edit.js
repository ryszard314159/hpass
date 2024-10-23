"use strict";

import { storageGet, storageSet, CRYPTO, objDiff, cleanUp } from "./core/lib.js";
import { decryptText } from "./core/crypto.js"

const el = {};
el.hint = document.getElementById('editHint');
el.salt = document.getElementById('editSalt');
el.pepper = document.getElementById('editPepper');
el.length = document.getElementById('editLength');
el.save = document.getElementById('save');
el.fileInputModal = document.getElementById("fileInputModal");
el.importFileInput = document.getElementById('importFileInput');
const opts = await storageGet({key: "options"});
console.log("edit:0: opts=", opts);

// ( async () => {

  Object.keys(opts).forEach ( function(k) {
    el[k].addEventListener('click', function(event) {
      opts[k] = el[k].value;
      console.log("edit:1: opts=", opts);
    });
  });

  // el.save.addEventListener('click', function() {
  //   console.log("edit: save: hint=", el.hint.value)
  //   opts.salt = el.salt.value;
  //   opts.pepper = el.pepper.value;
  //   opts.length = el.length.value;
  //   storageSet({key: "options", value: opts});
  //   console.log("edit: save: opts=", opts)
  // });

// }) ();

document.querySelectorAll(".reset").forEach(function(element) {
  element.addEventListener("click", function (event) {
    const debug = false;
    if (debug) console.log("reset Event listener triggered!"); // Should log when clicked
    if (confirm("Confirm reset: all existing settings will be removed!")) {
      event.preventDefault();
      localStorage.clear();
      window.location.reload();
    }
  });
});

document.querySelector(".btn.edit").addEventListener("click", async function () {
  const opts = await storageGet({key: "options"});
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  if (el.hint.value !== '') {
    const storedSites = await storageGet({key: "sites"});
    if (storedSites === "undefined") return;
    const hopt = storedSites[el.hint.value];
    if (hopt === "undefined") return;
    const diff = objDiff(hopt, opts);
    Object.keys(diff).forEach( (key) => opts[key] = diff[key])
    el.salt.value = opts.salt;
    el.pepper.value = opts.pepper;
    el.length.value = opts.length;
  }
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
    const hs = sites[hint];
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
  const debug = true;
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
