"use strict";
async function createCredential(challengeLength=64, userIdLength=32) {
    console.log("in createCredential...");
    const challenge = crypto.getRandomValues(new Uint8Array(challengeLength));
    let userIdBase64 = localStorage.getItem("userId");
    let userIdUint8Array;
    if (!userIdBase64) {
      userIdUint8Array = crypto.getRandomValues(new Uint8Array(userIdLength));
      userIdBase64 = btoa(String.fromCharCode(...userIdUint8Array)); // Base64 encoded bytes
      localStorage.setItem("userId", userIdBase64);
      console.log("Generated new userId:", userIdBase64);
    } else {
      console.log("Retrieved existing userId:", userIdBase64);
      try {
        // Decode Base64 and convert back to Uint8Array
        const decoded = atob(userIdBase64);
        userIdUint8Array = new Uint8Array([...decoded].map(char => char.charCodeAt(0)));
      } catch (error) {
        console.warn("Error decoding userId. Generating a new one:", error);
        userIdUint8Array = crypto.getRandomValues(new Uint8Array(userIdLength));
        userIdBase64 = btoa(String.fromCharCode(...userIdUint8Array));
        localStorage.setItem("userId", userIdBase64);
      }
    }
    const userName = crypto.randomUUID();
    const displayName = "Anonymous";
    const options = {
      publicKey: {
        rp: {
          name: "HPASS",               // Display name for the relying party
          id: window.location.hostname // Use the PWA's domain or "localhost" for testing
        },
        user: {
          id: userIdUint8Array,
          name: userName,
          displayName: displayName
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        timeout: 60000,                 // Time in ms
        challenge: challenge,           // Must be random and unique per request
        attestation: "none"             // Use "none" for privacy, "direct" for more info
      }
    };
  
    try {
      const credential = await navigator.credentials.create(options);
      console.log("Credential created:", credential); 
      // credential.rawId returned by navigator.credentials.create()
      // Store the rawId as Base64
      const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem("credential.rawId", rawIdBase64);
    } catch (err) {
      console.error("Error creating credential:", err);
    }
}

async function getCredential(challengeLength=64) {
  const challenge = crypto.getRandomValues(new Uint8Array(challengeLength));
  const storedRawIdBase64 = localStorage.getItem("credential.rawId");
  if (!storedRawIdBase64) {
    console.error("No stored credential found.");
    return;
  }
  const storedRawId = new Uint8Array(atob(storedRawIdBase64)
                          .split("").map(c => c.charCodeAt(0)));
  const options = {
    publicKey: {
      challenge: challenge,           // Must match the server's expectation
      rpId: window.location.hostname, // Use the PWA's domain or "localhost"
      userVerification: "preferred"   // "preferred", "required", or "discouraged"
    }
  };
  try {
    const credential = await navigator.credentials.get(options);
    console.log("Credential retrieved:", credential);
    // Validate or use the credential for authentication
  } catch (err) {
    console.error("Error retrieving credential:", err);
  }
}

// Simulate registration (create credentials)
document.getElementById("register").addEventListener("click", async () => {
    await createCredential();
    console.log("Credential created?")
});
  
// Simulate authentication (retrieve credentials)
document.getElementById("authenticate").addEventListener("click", async () => {
  await getCredential();
});
  