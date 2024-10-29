"use strict";

const debug = true;
const ITERATIONS = (debug) ? 999 : 99999;
const HASH_ALGORITHM = (debug) ? 'SHA-1': 'SHA-512';
const KDF = 'PBKDF2'; // Key Derivation Function
const ALGO = 'AES-GCM'; // The encryption algorithm you want to derive the key for
const KEY_LENGTH = (debug) ? 128 : 256; // Length of the key in bits (can be 128, 192, or 256)
const SALT_LENGTH = (debug) ? 16 : 32;
const DONT_ALLOW_KEY_EXTRACTION = false; // Set this for derived keys

async function deriveKey(password, salt) {
  if (!crypto.subtle) {
    throw new Error("Web Crypto API is not supported in this environment");
  }
  const encoder = new TextEncoder();
  const passwordKey = encoder.encode(password); // Convert password to ArrayBuffer

  const baseKey = await crypto.subtle.importKey( // Import the password as a key
    'raw',
    passwordKey,
    {name: KDF},
    DONT_ALLOW_KEY_EXTRACTION, // Must be false for KDF keys
    ['deriveKey']
  );

  // Derive a key using KDF (PBKDF2)
  const derivedKey = await crypto.subtle.deriveKey(
    { 
      name: KDF,
      salt: salt, // Use the Uint8Array salt directly
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    baseKey,
    {
      name: ALGO,
      length: KEY_LENGTH
    },
    false, // KDF keys must have extractable=false
    ['encrypt', 'decrypt'] // Key usages
  );

  if (0) console.log("DEBUG: deriveKey: Key derived successfully");
  return { derivedKey };
}

async function createKey(password) {
    const SALT = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const saltHex = Array.from(SALT).map(b => b.toString(16).padStart(2, '0')).join('');
    const { derivedKey } = await deriveKey(password, SALT);
    return { derivedKey, SALT, saltHex };
}

async function encryptText(password, plainText, separator = '|') {
    // Generate the key and salt
    if (1) console.log(`encryptText:1: password= ${password}, plainText= ${plainText}`);
    const { derivedKey, SALT, saltHex } = await createKey(password);
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText); // Convert plaintext to ArrayBuffer
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector (12 bytes for AES-GCM)
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGO, iv: iv },
      derivedKey,
      data
    );
    // Convert salt, iv, and ciphertext to hex for storage/transmission
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const ciphertextHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    // Concatenate salt, iv, and ciphertext for storage/transfer
    const encrypted = `${saltHex}${separator}${ivHex}${separator}${ciphertextHex}`;
    if (1) console.log(`encryptText:2: password= ${password}, encrypted= ${encrypted}`);
    return encrypted;
}
  
async function __decryptText(password, encryptedString, separator = '|') {
    // Split the stored encrypted data (salt:iv:ciphertext)
    // debugger;
    if (typeof(encryptedString) !== "string") {
      throw new TypeError(`wrong encryptedString= ${encryptedString}`);
    }
    const [saltHex, ivHex, ciphertextHex] = encryptedString.split(separator);
    // Convert salt and iv back to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    // Derive the key again using the password and extracted salt
    const { derivedKey } = await createKeyFromSalt(password, salt);
    // Decrypt the ciphertext
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGO, iv: iv },
        derivedKey,
        ciphertext
    );
    // Convert encrypted data back to string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);
    return decryptedString;
}

async function decryptText(password, encryptedString, separator = '|') {
  if (1) console.log(`decryptText:1: password= ${password}, encrypted= ${encryptedString}`);
  try {
    // Split the stored encrypted data (salt:iv:ciphertext)
    if (typeof encryptedString !== "string") {
      throw new TypeError(`wrong encryptedString= ${encryptedString}`);
    }
    const [saltHex, ivHex, ciphertextHex] = encryptedString.split(separator);
    // Convert salt and iv back to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    // Derive the key again using the password and extracted salt
    const { derivedKey } = await createKeyFromSalt(password, salt);
    // Decrypt the ciphertext
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGO, iv: iv },
        derivedKey,
        ciphertext
    );
    // Convert encrypted data back to string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);
    if (1) console.log(`decryptText:2: password= ${password}, decrypted= ${decryptedString}`);
    return decryptedString;
  } catch (error) {
    // If decryption fails, return null
    if (1) console.log(`decryptText:3: password= ${password}, encrypted= ${encryptedString}`);
    if (1) console.trace();
    if (error.name === 'OperationError' || error.message.includes('decryption')) {
      return null;
    }
    // Re-throw other errors
    if (1) console.log(`decryptText:4: password= ${password}, encrypted= ${encryptedString}`);
    throw error;
  }
}
  
async function createKeyFromSalt(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = encoder.encode(password); // Convert password to ArrayBuffer
    // Import password as a raw key
    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordKey,
        { name: KDF },
        DONT_ALLOW_KEY_EXTRACTION, // Derived key should not be extractable
        ['deriveKey']
    );
    // Derive key from the password and extracted salt
    const derivedKey = await crypto.subtle.deriveKey(
        {
        name: KDF,
        salt: salt,
        iterations: ITERATIONS,
        hash: HASH_ALGORITHM
        },
        baseKey,
        {
        name: ALGO,
        length: KEY_LENGTH
        },
        false, // KDF keys must have extractable=false
        ['encrypt', 'decrypt']
    );
    return { derivedKey };
}

async function createHash(password, storedSaltHex = null) {
  const encoder = new TextEncoder();
  const passwordKey = encoder.encode(password); // Convert password to ArrayBuffer

  const salt = (storedSaltHex === null)
        ? crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
        : new Uint8Array(storedSaltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  // const salt = "DEBUG";

  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordKey,
    { name: KDF },
    false,
    ['deriveBits']
  );

  // Derive a hash using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: KDF,
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    baseKey,
    KEY_LENGTH
  );

  // Convert the hash and salt to hexadecimal for storage
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  // return { hashHex: hashHex, saltHex: saltHex };
  return `${saltHex}|${hashHex}`;
}

async function verifyPassword(storedPasswordHash, password) {
  const [storedSaltHex, storedHashHex] = storedPasswordHash.split('|');
  const x = await createHash(password, storedSaltHex);
  const [_, hashHex] = x.split('|'); 
  return storedHashHex === hashHex;
}

async function test() {
    const password = "PASSWORD";
    const plainString = "plain text";
    console.log(`Password: ${password}`);
    console.log(`Plain String: ${plainString}`);
    //---
    // test encryption
    //---
    const encryptedString = await encryptText(password, plainString);
    const decryptedString = await decryptText(password, encryptedString);
    console.log(`plainString= ${plainString}`);
    console.log(`encrypted= ${encryptedString}`);
    const cryptTest = (plainString === decryptedString) ? "PASSED" : "FAILED";
    console.log(`encrypt/decrypt test ${cryptTest}`);
    //---
    // test hashing
    //---
    const passwordHash = await createHash(password);
    console.log(`passwordHash: ${passwordHash}`);
    const correct = await verifyPassword(passwordHash, password);
    const wrong = await verifyPassword(passwordHash, `WRONG:${password}`);
    const hashTest = (correct && !wrong) ? "PASSED" : "FAILED";
    console.log(`hash test: ${hashTest}`);
    if ([cryptTest, hashTest].includes("FAILED")) {
      throw new Error('crypto tests failed');
    }
}

// if (debug) test();

// ( async () => {
//   const encryptedString = "1743724d69fd50a2e63f40382a553647|5556f3e675d495cad613a0e4|5005d507ba43cf4e052fed02798e49ba7e44636e9de72f45971ae6b5468278be57e52c89967df600b5cecb8479220305a50a6b84af3caa964109bf3f4d2f9477fdf7339628a3"
//   try {
//     const decrypted = await decryptText("", encryptedString);
//     console.log(`decrypted= ${decrypted}`);
//   } catch(error) {
//     console.log(`decryptText failed on encryptedString= ${encryptedString}`);
//   }
// }) ();

export { encryptText, decryptText, createHash, verifyPassword};
