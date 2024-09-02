
"use strict";

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

function getKey(PASSWORD) {
  const niter = 999;
  const CRYPTO_KEY = CryptoJS.PBKDF2(PASSWORD, "", { keySize: 512 / 32, iterations: niter});
  return CRYPTO_KEY.toString();
}

function setOptions(opts, PASSWORD) {
  const debug = false;
  //  const parent = getCallerFunctionName();
  if (debug) console.log("setOptions: caller info: ", getCallerInfo());
  const sopts = JSON.stringify(opts);
  // const encrypted = CryptoJS.AES.encrypt(sopts, PASSWORD);
  const encrypted = CryptoJS.AES.encrypt(sopts, getKey(PASSWORD));
  localStorage.setItem("options", encrypted);
}

function getOptions(PASSWORD) {
  const debug = false;
  const info = getCallerInfo();
  const tag = `getOptions:`;
  if (debug) console.log(`${tag}: caller info:`, getCallerInfo());
  let v = null;
  try {
    const x = localStorage.getItem("options");
    if (x !== null) {
      if (debug) console.log(`${tag} options= ${x}`);
      // const dx = CryptoJS.AES.decrypt(x, PASSWORD).toString(CryptoJS.enc.Utf8);
      const dx = CryptoJS.AES.decrypt(x, getKey(PASSWORD)).toString(CryptoJS.enc.Utf8);
      if (debug) console.log(`${tag} PASSWORD= ${PASSWORD}`);
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

function setPasswordHash(PASSWORD) {
  const h = createPasswordHash(PASSWORD);
  localStorage.setItem("pwdHash", h);
  return h;
}

export {getOptions, setOptions, getCallerInfo};
export {getPasswordHash, setPasswordHash, createPasswordHash}
