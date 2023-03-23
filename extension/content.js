window.addEventListener("load", run, false);

function run() {
  const email = document.querySelector('input[type="email"]');
  const password = document.querySelector('input[type="password"]');
  if ((email === null) & (password === null)) {
    console.log("content: no email or password input detected...");
    return;
  }
  const msg = { from: "content", domain: document.domain };
  console.log("content: sending message to service worker: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((request) => {
    if (email !== null) email.value = request.email;
    if (password !== null) password.value = request.password;
  });
}
