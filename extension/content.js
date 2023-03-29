/*
Some sites do not allow copy/paste or automated password field fillout.
Maybe some solutions along these lines might help: 
1 - https://stackoverflow.com/questions/47617616/how-to-simulate-typing-in-an-input-box-with-javascript
2 - https://chat.openai.com/chat/71091eb6-4b49-480c-b286-a4020d90d20d
*/

window.addEventListener("load", run, false);

function run() {
  const emailInput = document.querySelector('input[type="email"]');
  const passwordInput = document.querySelector('input[type="password"]');
  const msg = { from: "content", domain: document.domain };
  console.log("content: run:1: message for sw: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  console.log("content: run:2: message for sw: msg= ", msg);
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("content: onMessage: msg= ", msg);
    setValue(emailInput, msg.email, false);
    setValue(passwordInput, msg.password, true);
  });
}

function setValue(elInput, value, toClipboard) {
  if (elInput !== null) {
    elInput.value = value;
    if (toClipboard) navigator.clipboard.writeText(value);
  }
}
