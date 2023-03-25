window.addEventListener("load", run, false);

function run() {
  const email = document.querySelector('input[type="email"]');
  const password = document.querySelector('input[type="password"]');
  const msg = { from: "content", domain: document.domain };
  chrome.runtime.sendMessage(msg);
  console.log("content: sent message for sw: msg= ", msg);
  if ((email === null) & (password === null)) {
    console.log("content: no email or password input detected...");
    // return;
  }
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("content: onMessage: msg= ", msg);
    if (email !== null) email.value = msg.email;
    if (password !== null) {
      password.value = msg.password;
      navigator.clipboard.writeText(msg.password);
    }
  });
}
