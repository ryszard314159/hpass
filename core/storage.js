
"use strict";

// let CRYPTO_KEY = null;
// import { PASSWORD, CRYPTO_KEY, CRYPTO_KEY_SIZE } from './globals.js';

const CRYPTO_PREFIX = "prefix:"

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

function kdf(pwd, keySize) {
  const options = { keySize: keySize, iterations: 999, hasher: CryptoJS.algo.SHA512};
  // const k = CryptoJS.PBKDF2(PASSWORD, "", { keySize: 512 / 32, iterations: niter});
  // CryptoJS.PBKDF2(password, salt, { keySize: keySize, iterations: iterations, hasher: hasher });
  salt = "salt";
  const k = CryptoJS.PBKDF2(pwd, salt, options);
  return k.toString();
}

// function validKey(key, keySize) {
//   const size = CryptoJS.enc.Utf8.parse(key).words.length;
//   return size === keySize * 2;
// }

// 0 - calculate size of tryKey
// 1 - if password is undefined convert it to an empty string
// 2 - if the size of tryKey is
function validKey(tryKey, keySize, pwd) {
  const size = CryptoJS.enc.Utf8.parse(tryKey).words.length;
  const key = (size != keySize * 2) ? kdf(pwd, keySize) : tryKey;
  return key;
}

function setOptions(opts, pwd, tryKey, keySize) {
  const debug = true;
  //  const parent = getCallerFunctionName();
  if (debug) console.log("setOptions: caller info: ", getCallerInfo());
  if (debug) console.log("setOptions:0: pwd: ", pwd);
  if (debug) console.log("setOptions:0: tryKey: ", tryKey);
  if (debug) console.log(`setOptions:1: tryKey= ${tryKey}`);
  // CRYPTO_KEY = validKey(CRYPTO_KEY, keySize) ? kdf(PASSWORD, keySize) : CRYPTO_KEY;
  const key = validKey(tryKey, keySize, pwd);
  if (debug) console.log(`setOptions:1: key= ${key}`);
  const sopts = JSON.stringify(opts);
  // const encrypted = CryptoJS.AES.encrypt(sopts, PASSWORD);
  // const encrypted = CryptoJS.AES.encrypt(sopts, getKey(PASSWORD));
  // TODO: add prefix to validate correct encrypt/decrypt
  // TODO: const encrypted = CryptoJS.AES.encrypt(CRYPTO_PREFIX + sopts, key);
  const encrypted = CryptoJS.AES.encrypt(sopts, key);
  localStorage.setItem("options", encrypted);
  return key;
}

function getOptions(pwd, tryKey, keySize) {
  const debug = true;
  const info = getCallerInfo();
  const tag = `getOptions:`;
  if (debug) console.log(`${tag}: caller info:`, getCallerInfo());
  let v = null;
  const key = validKey(tryKey, keySize, pwd)
  try {
    const x = localStorage.getItem("options");
    if (x !== null) {
      if (debug) console.log(`${tag} options= ${x}`);
      if (debug) console.log(`${tag} pwd= ${pwd}`);
      if (debug) console.log(`${tag} key= ${key}`);
      // const dx = CryptoJS.AES.decrypt(x, PASSWORD).toString(CryptoJS.enc.Utf8);
      // const dx = CryptoJS.AES.decrypt(x, getKey(PASSWORD)).toString(CryptoJS.enc.Utf8);
      // TODO: const x = CryptoJS.AES.decrypt(x, key).toString(CryptoJS.enc.Utf8);
      // TODO: const dx = x.replace(new RegExp('^' + CRYPTO_PREFIX), '')
      // TODO: correct = x.length - CRYPTO_PREFIX.length === dx.length
      const dx = CryptoJS.AES.decrypt(x, key).toString(CryptoJS.enc.Utf8);
      if (debug) console.log(`${tag} pwd= ${pwd}`);
      if (debug) console.log(`${tag} decrypted options= ${dx}`);
      v = JSON.parse(dx);
      if (debug) console.log(`${tag} v= `, v);
    } else {
      v = null;
    }
    return v;
  }
  catch (err) {
    if (debug) console.log(`${tag}: caller info:`, getCallerInfo());
    if (debug) console.log(`${tag} ERROR: ${err.message}`);
    alert(`${tag} ERROR= ${err.message}`);
    return null;
  }
}

function createPasswordHash(pwd) {
  return CryptoJS.SHA256(pwd).toString();
}

function getPasswordHash() {
  let h = localStorage.getItem("pwdHash");
  if (h === null) {
    h = CryptoJS.SHA256(null).toString();
    localStorage.setItem("pwdHash", h);
    let msg = `Password hash did not exist.
    <br>Password set to null and hash saved.`
    alert(msg);
  }
  return h;
}

function setPasswordHash(pwd) {
  const h = createPasswordHash(pwd);
  localStorage.setItem("pwdHash", h);
  return h;
}

export {getOptions, setOptions, getCallerInfo};
export {getPasswordHash, setPasswordHash, createPasswordHash};
export {kdf}; //, CRYPTO_KEY};

/*

// CryptoJS.PBKDF2(password, salt, { keySize: keySize, iterations: iterations, hasher: hasher });
options = { keySize: 16/8, iterations:3, hasher: CryptoJS.algo.SHA512 }
msg = "message"
prefix = "prefix:"
key = CryptoJS.PBKDF2("pwd", "salt", options).toString()
encrypted = CryptoJS.AES.encrypt(prefix + msg, key).toString()
decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8)
*/
