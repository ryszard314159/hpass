/* HPASS - reproducible password generator.
 * Copyright (C) 2023 Ryszard Czerminski
 *
 * This file is part of HPASS.
 * HPASS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * HPASS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

// debugger;
import { encryptText, decryptText } from "./crypto.js";

const globalDefaults = {salt: "Replace Me!", pepper: "_", length: 15};
const MINLENGTH = 4;
const MAXLENGTH = 128;
const MP31 = 2 ** 31 - 1; // Mersenne prime
const CHARS = {};
CHARS.digits = "0123456789";
CHARS.lower = "abcdefghijklmnopqrstuvwxyz";
CHARS.upper = CHARS.lower.toUpperCase();
CHARS.punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

const CRYPTO = {passwd: ''};
CRYPTO.encryptedItems = ["options", "sites"];
// CRYPTO.encryptedStorage = true;
CRYPTO.decryptedIOuntil = 0;
CRYPTO.encryptedIO = false;
CRYPTO.encryptedAll = false;
CRYPTO.decryptedIOspan = 60000 / 4;
CRYPTO.decryptedIOEnabled = false;
// if (typeof(window) !== 'undefined') {
//   // TODO: CRYPTO.options = { keySize: 8, iterations: 999, hasher: CryptoJS.algo.SHA512};
//   CRYPTO.options = { keySize: 2, iterations: 999, hasher: CryptoJS.algo.SHA512};
// }
// CRYPTO.enableDecryptedIO = () => {
//   CRYPTO.decryptedIOuntil = Date.now() + CRYPTO.decryptedIOspan;
// }
CRYPTO.disableDecryptedIO = () => {
  CRYPTO.decryptedIOEnabled = false;
}

CRYPTO.enableDecryptedIO = () => {
  CRYPTO.decryptedIOEnabled = true;
  setTimeout(() => {
    CRYPTO.decryptedIOEnabled = false;
    document.querySelector(".crypt").click();
  }, CRYPTO.decryptedIOspan); // 60 seconds (1 minute)  
}

const hpassStorage = {};
hpassStorage.setItem = function(key, value, tag='') {
  if (key === "pwdHash") {
    console.log(`hpassStorage: key=${key}, value= ${value}, tag= ${tag}`);
    console.trace();
  }
  localStorage.setItem(key,value);
  updateLocalStorage(key, value);
};

function matchingKeys(x, y) {
  const v = x.every(item => y.includes(item)) && y.every(item => x.includes(item));
  return v;
}

function EncryptedStorageHandler(property, value) {
  console.log(`EncryptedStorage State changed: ${property} = ${value}`);
  // ... do something
}

function EncryptedAllHandler(property, value) {
  console.log(`EncryptedAll State changed: ${property} = ${value}`);
  // ... do something
}

// https://stackoverflow.com/questions/13335967/export-data-in-localstorage-for-later-re-import

function objDiff(x, y) {
  if (y === null) return x;
  const diff = {};
  for (let key in x) {
      if (x[key] !== y[key]) {
          diff[key] = x[key];
      }
  }
  return diff;
}



// const obj = { a: 1, b: 2, x: {}, y: null, z: undefined };
// console.log(cleanUp(obj)); // { a: 1, b: 2 }
function cleanUp(obj) {
  if (obj === null || obj === undefined) return null;
  const cleanedObj = Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) return acc;
    if (typeof value === 'object') {
      value = cleanUp(value);
      if (value === null) return acc; 
    }
    acc[key] = value;
    return acc;
  }, {});
  return Object.keys(cleanedObj).length === 0 ? null : cleanedObj;
}

// returns setA \ setB
function setsDiff(setA, setB) {
  const difference = new Set();
  for (let element of setA) {
      if (!setB.has(element)) {
          difference.add(element);
      }
  }
  return difference;
}

function setsAreEqual(setA, setB) {
  if (setA.size !== setB.size) {
      return false;
  }
  for (let element of setA) {
      if (!setB.has(element)) {
          return false;
      }
  }
  return true;
}

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
      return true; // Both are the same object
  }

  if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return false; // Not objects or one is null
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
      return false; // Different number of properties
  }

  for (let key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
          return false; // Different values for the same property
      }
  }

  return true;
}

/* permute chars in string using Durstenfeld shuffle algorithm */
/**
 *
 * @param {string} string to be shuffled
 * @param {function} gint random integer generator
 * @returns
 */
function shuffle_string(string, gint = rig(MP31, seed)) {
  let z = string.split(""), i, j;
  for (i = z.length - 1; i > 0; i--) {
    j = gint.next().value % i;
    [z[i], z[j]] = [z[j], z[i]];
  }
  return z.join("");
}

/**
 *
 * @param {string} s to be hashed
 * @returns hash generated from the string s
 */
function hash_string(s) {
  console.assert(typeof s === "string", `string expected, got ${s}`);
  // Mersenne primes: 2^(2, 3, 5, 7, 13, 17, 19, 31, 67, 127, 257)
  const p = 2 ** 5 - 1
  const m = MP31; // 2**31 - 1
  let value = MP31; // 2**31 - 1;
  let pp = 1;
  for (let j = 0; j < s.length; j++) {
    value = (value + s.charCodeAt(j) * pp) % m;
    pp = (pp * p) % m;
  }
  return value;
}

/*
create small array of random integers
Donald Knuth MMIX: m = 2**64; a=6364136223846793005; c = 1442695040888963407
*/
// random integer generator
// generates integers in [0, max) interval
function* rig(max, hint) {
  let m = MP31,
    a = 2147483629,
    c = 2147483587;
  console.assert(
    typeof max === "number" && 0 < max && max <= m,
    `rig: max (=${max}) must be number and has to be smaller than 2**31 - 1`
  );
  console.assert(
    typeof hint === "string",
    `hint must be string, got ${typeof hint}`
  );
  let seed = hint == "" ? Date.now() : hash_string(hint);
  while (true) {
    seed = (a * seed + c) % m;
    yield Math.abs(seed % max);
  }
}

function get_random_string(n, charset = "", gint = rig(MP31, "")) {
  // seed=undefined) {
  /*
  n       : length of string to generate
  charset : alphabet to use; NOTE: all unicode chars will be used if charset == ''
  gint    : random integer generator
  */
  const MAX_CODE_POINT = 1114111 + 1;
  console.assert(
    0 < n && n < MAXLENGTH,
    `get_random_string: n must be in (1,${MAXLENGTH}) range, got ${n}`
  );
  console.assert(
    charset.length < MAX_CODE_POINT,
    `too long charset, ${charset.length}`
  );
  /*
  see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
  */
  let z = "";
  for (let i = 0; i < n; i++) {
    let k = gint.next().value;
    z +=
      charset !== ""
        ? charset[k % charset.length]
        : String.fromCodePoint(k % MAX_CODE_POINT);
  }
  return z;
}

// function getPass(args) {
function getPass(args = {}) {
  args = {
    hint: "",           // easy to remember hint for the site e.g. 'netflix', 'amazon' etc.
    pepper: "_",        // one or more special characters
    salt: "Salt",       // user secret to make it unique
    burn: 0,            // number of 'burn' (warm up) steps for RNG
    peak: "",           // personal top secret
    length: 15,         // length of generated password
    digits: false,      // use digits
    unicode: false,     // use unicode chars
    lower: false,       // use lower case
    upper: false,       // use upper case
    punctuation: false, // use punctuation
    no_shuffle: false,  // give it a shuffle before returning passwd string
    debug: false,       // extra debug printout
    verbose: false,     // print password, pepper, salt, and length
    ...args
  }

  let charset = "";
  if (!args.unicode) {
    if (args.digits) charset += CHARS.digits;
    if (args.letters) charset += CHARS.lower + CHARS.upper;
    if (args.punctuation) charset += CHARS.punctuation;
    if (charset.length == 0) charset = CHARS.digits + CHARS.lower + CHARS.upper;
  }
  let passwd;
  if (args.hint === "") {
    // generate and return random string from charset
    passwd = get_random_string(args.length, charset);
  } else {
    /*
      add to pepper one lower, one upper character and one digit
      to satisfy requirements of many sites
      one or more special characters can be provided in args.pepper (default='!')
    */
    let p = args.peak;
    p = (p === undefined) || (p === null) ? '' : p;
    let hint = args.hint + args.salt + args.pepper + args.length + p;
    let gint = rig(MP31, hint);
    for (let k = 0; k < args.burn; k++) {
      gint.next().value;
    }
    let lower = get_random_string(1, CHARS.lower, gint);
    let upper = get_random_string(1, CHARS.upper, gint);
    let digit = get_random_string(1, CHARS.digits, gint);
    const pepper = args.pepper + lower + upper + digit;
    let n = args.length - pepper.length;
    if (args.debug) {
      console.log(`DEBUG: args.peak= ${args.peak}, p= ${p}`);
      console.log(`DEBUG: args.hint= ${args.hint}`);
      console.log(`DEBUG: args.salt= ${args.salt}`);
      console.log(`DEBUG: args.pepper= ${args.pepper}`);
      console.log(`DEBUG: pepper= ${pepper}`);
      console.log(`DEBUG: args.length= ${args.length}`);
      console.log(`DEBUG: args.burn= ${args.burn}`);
      console.log(`DEBUG: n= ${n}`);
      console.log(`DEBUG: hint= ${hint}`);
    }
    console.assert(
      n >= 0,
      `pepper too long: args.length= ${args.length}, pepper= ${pepper}`
    );
    if (args.debug)
      console.log(
        `DEBUG: args.length= ${args.length}, pepper.length= ${pepper.length}, pepper= ${pepper}`
      );
    passwd = get_random_string(args.length - pepper.length, charset, gint);
    passwd = pepper + passwd; // augment password with pepper e.g. '!aZ9'
    if (!args.no_shuffle) {
      passwd = shuffle_string(passwd, gint);
    }
  }
  if (args.verbose) {
    console.log(
      `password= ${passwd} pepper= ${args.pepper} salt= ${args.salt} length= ${args.length}`
    );
  }
  return passwd;
}

function sanityCheck(args = {key: key, value: null, from: null}) {
  const plain = JSON.stringify(args.value);
  // const cryptoKey = createKey(CRYPTO.passwd);
  const fromStorage = localStorage.getItem(args.key);
  decryptText(CRYPTO.passwd, fromStorage).then(decrypted => {
    if (plain !== decrypted) {
      let msg = `sanityCheck: from= ${args.from}`;
      msg = `${msg}\nkey= ${args.key}`;
      msg = `${msg}\nCRYPTO.passwd=${CRYPTO.passwd}`
      msg = `${msg}\nplain= ${plain}\ndecrypted= ${decrypted}\nfromStorage= ${fromStorage}`;
      console.error(msg);
      throw new Error(`plain !== decrypted\n${msg}`);
    }
  });
}

function updateLocalStorage(key, value) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new StorageEvent('storage', {
    key: key,
    newValue: value,
    oldValue: localStorage.getItem(key),
  }));
}

async function storageSet(args) {
  const debug = 0;
  args = {key: null, value: null, pwd: CRYPTO.passwd, encrypt: true, ...args};
  if (!CRYPTO.encryptedItems.includes(args.key)) {
    throw new Error(`storageSet: invalid args.key= ${args.key}`);
  }
  if (args.value === undefined || args.value === "undefined") {
    throw new Error(`storageSet: undefined args.value= ${args.value}, args.key= ${args.key}}`);
  }
  if (typeof(args.value) !== "object") {
    throw new Error(`storageSet: not an object type: args.value= ${args.value}`);
  }
  let rawValue = JSON.stringify(args.value);
  const encryptedValue = await encryptText(args.pwd, rawValue);
  if (encryptedValue === undefined || encryptedValue === 'undefined') {
    throw new Error(`storageSet: undefined encryptedValue= ${encryptedValue}`);
  }
  // localStorage.setItem(args.key, encryptedValue);
  updateLocalStorage(args.key, encryptedValue);
  const storedValue = localStorage.getItem(args.key);
  if (storedValue !== encryptedValue) {
    console.error(`storageSet: args.key= ${args.key}`);
    console.error(`storageSet: encryptedValue= ${encryptedValue}`);
    console.error(`storageSet: storedValue= ${storedValue}`);
    throw new Error(`storageSet: storedValue !== encryptedValue}`);
  }
  sanityCheck({key: args.key, value: args.value, from: "storageSet"});
}

async function storageGet(args) {
  args = {key: null, pwd: CRYPTO.passwd, decrypt: true, ...args};
  let p = sessionStorage.getItem("password");
  args.pwd = (p === null) ? '' : p
  if (args.pwd === null || args.pwd === undefined) {
    const msg = `ERROR: storageGet: args.pwd === null|undefined, args= ${JSON.stringify(args)}`;
    console.error(msg);
    console.trace();
    alert(msg);
    return null;
  }
  const debug = false;
  if (!CRYPTO.encryptedItems.includes(args.key)) {
    throw new Error(`storageGet: invalid args.key= ${args.key}`);
  }
  let rawValue = localStorage.getItem(args.key);
  if (rawValue === null) return null;
  let decryptedValue, finalValue;
  try {
    decryptedValue = await decryptText(args.pwd, rawValue);
  } catch (error) {
    let msg = `ERROR: storageGet: while decrypting raValue:`;
    msg = `${msg}\nrawValue= ${rawValue}, args= ${JSON.stringify(args)}`;
    msg = `${msg}\nCRYPTO.passwd= ${CRYPTO.passwd}`;
    msg = `${msg}\nerror= ${error}`;
    console.error(msg);
    console.trace();
    throw new Error(msg);
  }
  try {
    finalValue = JSON.parse(decryptedValue);
  } catch (error) {
    let msg = `ERROR: storageGet: in JSON.parse(decryptedValue)`;
    alert(msg);
    console.error("storageGet: JSON parse error=", error);
    msg = `${msg}\nstorageGet: key= ${args.key}, pwd= ${args.pwd}`;
    msg = `${msg}\nstorageGet: args= ${JSON.stringify(args)}`;
    msg = `${msg}\nstorageGet: rawValue= ${rawValue}`;
    msg = `${msg}\nstorageGet: decryptedValue= ${decryptedValue}`;
    msg = `${msg}\nstorageGet: finalValue= ${finalValue}`;
    // try:
    // (async () => {v = await decryptText('', encrypted); console.log(v)})()
    console.error(msg);
    throw new Error(msg);
  }
  if (finalValue === null || typeof(finalValue) !== "object") {
    // let msg = `ERROR: storageGet: args.key= ${JSON.stringify(args)}, should not be string!!!}`;
    let msg = `ERROR: storageGet: bad finalValue for args.key= ${args.key}`;
    msg = `${msg}\nrawValue= ${rawValue}`;
    msg = `${msg}\ndecryptedValue= ${decryptedValue}`;
    msg = `${msg}\nfinalValue= ${finalValue}`;
    msg = `${msg}\nargs.pwd= ${args.pwd}`;
    const sessionPassword = sessionStorage.getItem("password");
    msg = `${msg}\nsessionPassword= ${sessionPassword}`;
    console.error(msg);
    console.trace()
    alert(msg);
  }
  return finalValue;
};


export {
  CHARS, MAXLENGTH, MINLENGTH, deepEqual, getPass, get_random_string, objDiff, rig, setsAreEqual, setsDiff
};
export { storageGet, storageSet, cleanUp, CRYPTO, sanityCheck };
export { globalDefaults, updateLocalStorage, hpassStorage }
// export { setGenericOptions, createSplashScreen }
