const el = {};
["hint", "password", "generate"].forEach((k) => {
  el[k] = document.getElementById(k);
});

function onLoad() {
  const msg = { from: "popup", hint: el.hint.value, when: "onLoad" };
  console.log("popup: onLoad: to sw: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((reply) => {
    let x = `popup: from sw: password= ${reply.password}, hint= ${reply.hint}`;
    console.log(x);
    let p = (el.password.value = reply.password);
    el.hint.value = reply.hint;
    console.log(`popup: password= ${p} written to clipboard`);
    el.password.focus();
    navigator.clipboard.writeText(p);
  });
}

function onGenerate() {
  const msg = { from: "popup", hint: el.hint.value, when: "onGenerate" };
  console.log("popup: onGenerate: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((reply) => {
    let x = `popup: onGenerate: from sw: password= ${reply.password}, hint= ${reply.hint}`;
    console.log(x);
    let p = (el.password.value = reply.password);
    el.hint.value = reply.hint;
    console.log(`popup: onGenerate: password= ${p} written to clipboard`);
    el.password.focus();
    navigator.clipboard.writeText(p);
  });
}

/*** handle events ***/

window.addEventListener("load", onLoad, true);
el.generate.addEventListener("click", onGenerate);
