"use strict";

const CHALLENGE_LENGTH = 64;
const USER_ID_LENGTH = 32;
const TIMEOUT = 60000;

function arrayBuffersAreEqual(ab1, ab2) {
  if (ab1.byteLength !== ab2.byteLength) return false;
  const view1 = new Uint8Array(ab1);
  const view2 = new Uint8Array(ab2);
  for (let i = 0; i < ab1.byteLength; i++) {
    if (view1[i] !== view2[i]) return false;
  }
  return true;
}

// ArrayBuffer to URL safe Base64 encoding
function abToBase64URL(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  let base64 = btoa(String.fromCharCode.apply(null, uint8Array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// URL safe Base64 encoding to ArrayBuffer
function base64UrlToAb(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const base64Padded = base64 + padding;
  const binaryString = atob(base64Padded);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array.buffer;
}

function getUserIdUint8Array(userIdLength) {
  // NOTE: just generate it fresh for now...
  let userIdUint8Array = crypto.getRandomValues(new Uint8Array(userIdLength));
  let userIdBase64URL = localStorage.getItem("userIdBase64URL");
  if (!userIdBase64URL) {
    userIdUint8Array = crypto.getRandomValues(new Uint8Array(userIdLength));
    userIdBase64URL = abToBase64URL(userIdUint8Array.buffer);
    localStorage.setItem("userIdBase64URL", userIdBase64URL);
    console.log("Generated new userId:", userIdBase64URL);
  } else {
    console.log("Retrieved existing userIdBase64URL:", userIdBase64URL);
    try {
      userIdUint8Array = new Uint8Array(base64UrlToAb(userIdBase64URL));
    } catch (error) {
      console.warn("Error decoding userId. Generating a new one:", error);
      userIdUint8Array = crypto.getRandomValues(new Uint8Array(userIdLength));
      userIdBase64URL = abToBase64URL(userIdUint8Array.buffer);
      localStorage.setItem("userIdBase64URL", userIdBase64URL);
    }
  }
  return userIdUint8Array;
}

async function register({
                         challengeLength = CHALLENGE_LENGTH,
                         userIdLength = USER_ID_LENGTH,
                         userName,
                         displayName,
                         rpName = "HPASS",
                         rpId = window.location.hostname,
                         timeout = TIMEOUT
                        } = {}) {
    console.log("Registering credential...");
    const storedCredentialId = localStorage.getItem("credential.id");
    if (storedCredentialId) {
      alert("register: credential.id already stored- quitting...");
      return true;
    }
    // Prompt for user details if not provided
    userName = userName || prompt("Username (e.g., email):", "example@domain.com");
    displayName = displayName || prompt("Enter a display name:", "Example User");
    const challenge = crypto.getRandomValues(new Uint8Array(challengeLength));
    const userIdUint8Array = getUserIdUint8Array(userIdLength);
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    const options = {
      publicKey: {
        rp: {
          name: rpName, // Display name for the relying party
          id: rpId      // Use the PWA's domain or "localhost" for testing
        },
        // user is required for Client-side PWA
        user: { id: userIdUint8Array, name: userName, displayName: displayName },
        authenticatorSelection: {
          // requireResidentKey: false,
          // residentKey: 'discouraged',
          // requireResidentKey: true,
          // residentKey: "required",
          requireResidentKey: isAvailable,
          residentKey: isAvailable ? "required" : "discouraged",
          userVerification: 'required',
          // authenticatorAttachment: 'platform'
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        timeout: timeout,
        challenge: challenge,  // Must be random and unique per request
        attestation: "none"    // Use "none" for privacy, "direct" for more info
      }
    };
    try {
      const credential = await navigator.credentials.create(options);
      console.log("register: created credential=", credential); 
      // NOTE: credential.id is the same as Base64 encoded rawId !!!
      localStorage.setItem("credential.id", credential.id);
      // localStorage.setItem("credential.type", credential.type); // for potential future use
      // NOTE: do not store crential.publicKey???
      // const publicKey = JSON.stringify(credential.publicKey);
      // localStorage.setItem("publicKey", publicKey);
    } catch (error) {
      console.error("register: error=", error);
      // console.error(`register: JSON.stringify(error)=", ${JSON.stringify(error)}`);
      alert(`ERROR: in register; check log`);
      return false;
    }
    return true;
}

async function authenticate({
                             challengeLength = CHALLENGE_LENGTH,
                             rpId = window.location.hostname
                            } = {}) {
  console.log("Authenticating credential...");
  const challenge = crypto.getRandomValues(new Uint8Array(challengeLength));
  // const storedId = localStorage.getItem("credential.id"); // Base64 URL-encoded rawId 
  const options = {
    publicKey: {
      challenge: challenge,         // Challenge must be random and unique per request
      rpId: rpId,
      userVerification: "required"  // "preferred", "required", or "discouraged"
    }
  };
  try {
    const credential = await navigator.credentials.get(options);
    console.log("Credential retrieved:", credential);
    // Browser-level validation is sufficient for client-only PWA use cases.
    // Uncomment the following section if manual validation is added in the future:
    /*
    const isValid = await validateSignature(credential, challenge);
    if (isValid) {
      console.log("Authentication successful");
    } else {
      console.error("Authentication failed");
    }
    */
    console.log("Authentication successful (browser-verified).");
    return true;
  } catch (err) {
    console.error("Error retrieving credential:", err);
    return false;
  }
}

async function validateSignature(credential, challenge) {
  console.warn("validateSignature is not required in client-only PWA setups.");
  console.log("Credential ID:", credential.id);
  console.log("Challenge used:", challenge);

  // For debugging or optional future use, log the signature details
  const signature = new Uint8Array(credential.response.signature);
  console.log("Signature (raw):", signature);

  // If in the future you need signature verification, ensure you have:
  // 1. Access to the stored public key (e.g., via localStorage or other mechanisms).
  // 2. The necessary cryptographic algorithms for verification.

  return true; // Assume the browser's validation is sufficient for the current use case
}

// // Simulate registration (create credentials)
// document.getElementById("register").addEventListener("click", async () => {
//     alert("Register!");
//     if (!navigator.credentials || !navigator.credentials.create) {
//       console.error("WebAuthn is not supported in this browser.");
//       alert("WebAuthn is not supported in this browser.");
//       return;
//     }
//     await register({userName: crypto.randomUUID(), displayName: "Anonymous"});
//     // or prompt the user
//     // await register();
//     console.log("Credential created?")
// });
  
// // Simulate authentication (retrieve credentials)
// document.getElementById("authenticate").addEventListener("click", async () => {
//   alert("Autheticate!");
//   if (!navigator.credentials || !navigator.credentials.get) {
//     console.error("WebAuthn is not supported in this browser.");
//     alert("WebAuthn is not supported in this browser.");
//     return;
//   }
//   await authenticate();
// });

export { register, authenticate }

/*
*********************************
*/

async function no_user_register(challengeLength=CHALLENGE_LENGTH, userIdLength=USER_ID_LENGTH) {
  console.log("in createCredential...");
  // challengeLength = 8;
  const challenge = crypto.getRandomValues(new Uint8Array(challengeLength));
  const options = {
    publicKey: {
      rp: {
        name: "HPASS",               // Display name for the relying party
        id: window.location.hostname // Use the PWA's domain or "localhost" for testing
      },
      authenticatorSelection: {
        requireResidentKey: false,
        userVerification: 'required',
        residentKey: 'discouraged',
        authenticatorAttachment: 'platform'
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,                // Time in ms
      challenge: challenge,          // Must be random and unique per request
      attestation: "none"            // Use "none" for privacy, "direct" for more info
    }
  };

  try {
    const credential = await navigator.credentials.create(options);
    console.log("Credential created:", credential); 
    // NOTE: credential.id is the same as Base64 encoded rawId !!!
    localStorage.setItem("credential.id", credential.id);
    localStorage.setItem("credential.type", credential.type);
    // NOTE: do not store ential.publicKey???
    // const publicKey = JSON.stringify(credential.publicKey);
    // localStorage.setItem("publicKey", publicKey);
  } catch (err) {
    console.error("Error creating credential:", err);
  }
}
  