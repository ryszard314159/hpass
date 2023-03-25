const el = {};
["hint", "password", "generate"].forEach((k) => {
  el[k] = document.getElementById(k);
});

function getPassAndHint() {
  const msg = { from: "popup", hint: el.hint.value };
  console.log("popup: to sw: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  chrome.runtime.onMessage.addListener((reply) => {
    let x = `popup: from sw: password= ${reply.password}, hint= ${reply.hint}`;
    console.log(x);
    let p = (el.password.value = reply.password);
    el.hint.value = reply.hint;
    console.log(`popup: password= ${p} written to clipboard`);
    navigator.clipboard.writeText(p);
  });
}

/*** events ***/

window.addEventListener("load", getPassAndHint, false);
el.generate.addEventListener("click", getPassAndHint);
