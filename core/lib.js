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

const MINLENGTH = 4;
const MAXLENGTH = 128;
const MP31 = 2 ** 31 - 1; // Mersenne prime
const CHARS = {};
CHARS.digits = "0123456789";
CHARS.lower = "abcdefghijklmnopqrstuvwxyz";
CHARS.upper = CHARS.lower.toUpperCase();
CHARS.punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const CRYPTO = {key: '', prefix: 'prefix:'};
if (typeof(window) !== 'undefined') {
  // TODO: CRYPTO.options = { keySize: 8, iterations: 999, hasher: CryptoJS.algo.SHA512};
  CRYPTO.options = { keySize: 2, iterations: 999, hasher: CryptoJS.algo.SHA512};
}
// const IV_LENGTH = 16; //16 bytes (128 bits) for the IV is standard for AES.
// const KEY_LENGTH = 24; // 24 bytes (192 bits) for the key is required for AES-192.

// import { scrypt, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// const crypto = require('crypto');
// const { scrypt, randomBytes, createCipheriv, createDecipheriv } = crypto;

// import CryptoJS from "crypto-js";

// // Function to encrypt data
// async function encrypt(text, password) {
//   return new Promise((resolve, reject) => {
//     scrypt(password, 'salt', KEY_LENGTH, (err, key) => {
//       if (err) reject(err);
//       const iv = randomBytes(IV_LENGTH); // Initialization vector
//       const cipher = createCipheriv('aes-192-cbc', key, iv);
//       let encrypted = cipher.update(text, 'utf8', 'hex');
//       encrypted += cipher.final('hex');
//       resolve(iv.toString('hex') + ':' + encrypted);
//     });
//   });
// }

// Function to decrypt data
// async function decrypt(encrypted, password) {
//   return new Promise((resolve, reject) => {
//     scrypt(password, 'salt', KEY_LENGTH, (err, key) => {
//       if (err) reject(err);
//       const [ivHex, encryptedText] = encrypted.split(':');
//       const iv = Buffer.from(ivHex, 'hex');
//       const decipher = createDecipheriv('aes-192-cbc', key, iv);
//       let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//       decrypted += decipher.final('utf8');
//       resolve(decrypted);
//     });
//   });
// }

// Example usage
// (async () => {
//   const password = 'Password used to generate key';
//   const text = 'some clear text data';

//   try {
//     const encrypted = await encrypt(text, password);
//     console.log('Encrypted:', encrypted);

//     const decrypted = await decrypt(encrypted, password);
//     console.log('Decrypted:', decrypted);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// })();

// 
// https://stackoverflow.com/questions/13335967/export-data-in-localstorage-for-later-re-import
function exportLocalStorage(encrypted=true) {
  const data = JSON.stringify(localStorage);
}

function importLocalStorage(encrypted=true) {
  const data = JSON.parse(/*paste stringified JSON from clipboard*/);
  Object.keys(data).forEach(function (k) {
    localStorage.setItem(k, JSON.stringify(data[k]));
  });
}

function objDiff(x, y) {
  const diff = {};
  for (let key in x) {
      if (x[key] !== y[key]) {
          diff[key] = x[key];
      }
  }
  return diff;
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
  const p = 2 ** 5 - 1,
    m = MP31; // 2**31 - 1
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

export { deepEqual, get_random_string, setsAreEqual, setsDiff, objDiff, rig,
  CHARS, MAXLENGTH, MINLENGTH };
export { getPass };
// export { encrypt, decrypt };

// *** //


// "use strict";

// let CRYPTO_KEY = null;
// import { PASSWORD, CRYPTO_KEY, CRYPTO_KEY_SIZE } from './globals.js';

// const CRYPTO_PREFIX = "prefix:"

function getCallerInfo() {
  try {
      throw new Error();
  } catch (e) {
      if (e.stack) {
          const stackLines = e.stack.split("\n");
          // The first two lines are the error and the current function, so we want the caller of the caller
          const callerLine = stackLines[3].trim(); // Adjust index if needed
          const match = callerLine.match(/at (\S+) \((.*):(\d+):(\d+)\)/);
          if (match) {
              return {
                  functionName: match[1],
                  filePath: match[2],
                  lineNumber: match[3],
                  columnNumber: match[4]
              };
          } else {
              const altMatch = callerLine.match(/at (.*):(\d+):(\d+)/);
              if (altMatch) {
                  return {
                      functionName: '<anonymous>',
                      filePath: altMatch[1],
                      lineNumber: altMatch[2],
                      columnNumber: altMatch[3]
                  };
              }
          }
      }
  }
  return null;
}

// https://en.wikipedia.org/wiki/Key_derivation_function
// function getKey(PASSWORD) {
//   const niter = 999;
//   CRYPTO_KE = CryptoJS.PBKDF2(PASSWORD, "", { keySize: 512 / 32, iterations: niter});
//   // return CRYPTO_KEY.toString();
// }

// function kdf(pwd, keySize) {
function kdf(pwd) {
  // const options = { keySize: keySize, iterations: 999, hasher: CryptoJS.algo.SHA512};
  // const k = CryptoJS.PBKDF2(PASSWORD, "", { keySize: 512 / 32, iterations: niter});
  // CryptoJS.PBKDF2(password, salt, { keySize: keySize, iterations: iterations, hasher: hasher });
  console.log(`kdf: pwd= ${pwd}`);
  const k = CryptoJS.PBKDF2(pwd, "salt", CRYPTO.options).toString();
  return k;
}

// function validKey(key, keySize) {
//   const size = CryptoJS.enc.Utf8.parse(key).words.length;
//   return size === keySize * 2;
// }

// 0 - calculate size of tryKey
// 1 - if password is undefined convert it to an empty string
// 2 - if the size of tryKey is
function validateKey(pwd) {
  const size = CryptoJS.enc.Utf8.parse(CRYPTO.key).words.length;
  CRYPTO.key = (size != CRYPTO.options.keySize * 2) ? kdf(pwd) : CRYPTO.key;
}

function encryptJSON(json) {
  const s = JSON.stringify(json);
  return CryptoJS.AES.encrypt(s, CRYPTO.key);
}

function decryptJSON(json) {
  const s = JSON.stringify(json);
  return CryptoJS.AES.encrypt(s, CRYPTO.key);
}

function storageSet(storageKey, obj, pwd) {
  const debug = true;
  validateKey(pwd); // validate CRYPTO.key
  const s = JSON.stringify(obj);
  const encrypted = CryptoJS.AES.encrypt(s, CRYPTO.key);
  localStorage.setItem(storageKey, encrypted);
  if (debug) {
    console.log(`storageSet: storageKey= ${storageKey}`);
    console.log(`storageSet: pwd= ${pwd}`)
    console.log("storageSet: obj= ", obj);
    console.log("storageSet: s= ", s);
    console.log("storageSet: CRYPTO.key= ", CRYPTO.key);
    console.log(`storageSet: encrypted= ${encrypted}`);
  }
}

function storageGet(storageKey, pwd) {
  const debug = true;
  if (debug) console.log(`storageGet: storageKey= ${storageKey}, pwd= ${pwd}`);
  if (debug) console.log(`storageGet:0: CRYPTO.key= ${CRYPTO.key}`)
  validateKey(pwd); // validate CRYPTO.key
  if (debug) console.log(`storageGet:1: CRYPTO.key= ${CRYPTO.key}`);
  const e = localStorage.getItem(storageKey);
  if (debug) console.log(`storageGet: e= ${e}`);
  if ( e === null ) {
    return null;
  } else {
    const d = CryptoJS.AES.decrypt(e, CRYPTO.key).toString(CryptoJS.enc.Utf8);
    if (debug) console.log(`storageGet: d= ${d}`);
    const o = JSON.parse(d);
    return o;
  }
};

function getOptions(pwd) {
  const debug = true;
  const info = getCallerInfo();
  const tag = `getOptions:`;
  if (debug) console.log(`${tag}: caller info:`, getCallerInfo());
  let opts;
  validateKey(pwd);
  try {
    const x = localStorage.getItem("options");
    if (x !== null) {
      if (debug) console.log(`${tag} options= ${x}`);
      if (debug) console.log(`${tag} pwd= ${pwd}`);
      if (debug) console.log(`${tag} CRYPTO.key= ${CRYPTO.key}`);
      const dx = CryptoJS.AES.decrypt(x, CRYPTO.key).toString(CryptoJS.enc.Utf8);
      if (debug) console.log(`${tag} pwd= ${pwd}`);
      if (debug) console.log(`${tag} decrypted options= ${dx}`);
      opts = JSON.parse(dx);
      if (debug) console.log(`${tag} opts= `, opts);
    } else {
      opts = null;
    }
    return opts;
  }
  catch (err) {
    if (debug) console.log(`${tag}: caller info:`, getCallerInfo());
    if (debug) console.log(`${tag} ERROR: ${err.message}`);
    alert(`${tag} ERROR= ${err.message}`);
    return null;
  }
}

// TODO: change to SHA.512
function createHash(pwd) {
  // crypto.createHash('sha256').update(pwd).digest().toString()
  const h = CryptoJS.SHA1(pwd).toString();
  if (localStorage.getItem('pwdHash') === null) {
    localStorage.setItem('pwdHash', h);
    console.log(`createHash: pwd= ${pwd}`);
    console.log(`createHash: h= ${h}`);
    alert(`Password hash did not exist`);
  }
  return h;
}

function encryptLocalStorage(oldPassword, newPassword, keys) {
  const debug = true;
  if (debug) console.log(`encryptLocalStorage: oldPassword= ${oldPassword}, newPassword= ${newPassword}`);
  if (debug) console.log(`encryptLocalStorage: keys= ${keys}`);
  keys.forEach(k => {
    const v = storageGet(k, oldPassword);
    if (debug) console.log(`encryptLocalStorage: k= ${k}`, "v= ", v);
    if (v !== null) storageSet(k, v, newPassword);
  })
}

export {storageGet, storageSet, getCallerInfo};
export {createHash};
export {kdf, CRYPTO, encryptLocalStorage};
