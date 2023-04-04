window.addEventListener("load", run);

function findUserInputs(allInputs) {
  let v = allInputs.filter((e) => {
    return e.type === "text";
  });
  if (v.length < 1) return null;
  v = v.filter((e) => {
    let x =
      e.id.toUpperCase().indexOf("USER") > -1 ||
      e.name.toUpperCase().indexOf("USER") > -1 ||
      e.placeholder.toUpperCase().indexOf("USER") > -1;
    if (x) {
      console.log("content: findUserInputs: found e= ", e);
    }
    return x;
  });
  return v.length > 0 ? v : null;
}

function findInputsByType(allInputs, type) {
  let v = allInputs.filter((e) => {
    return e.type === type;
  });
  return v.length > 0 ? v : null;
}

function getAllNodes(
  rootNode,
  tagName = "INPUT",
  validTypes = new Set(["email", "password", "text"])
) {
  function traverse(node) {
    all.push(node);
    if (!node.childNodes) return;
    node.childNodes.forEach((x) => traverse(x));
  }
  const all = [];
  traverse(rootNode);
  if (validTypes) foo = (e) => e.tagName === tagName && validTypes.has(e.type);
  else foo = (e) => e.tagName === tagName;
  return tagName ? all.filter(foo) : all;
}

function run() {
  const allInputElements = getAllNodes(document.body);
  if (allInputElements.length < 1) return;
  let usernameInputs = findUserInputs(allInputElements);
  let emailInputs = findInputsByType(allInputElements, "email");
  let passwordInputs = findInputsByType(allInputElements, "password");
  if (!(emailInputs || passwordInputs || usernameInputs)) return;
  const msg = { from: "content", domain: document.domain };
  chrome.runtime.sendMessage(msg);
  console.log("content: run: sent message for sw: msg= ", msg);
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("content: onMessage: msg= ", msg);
    setValues(emailInputs, msg.email);
    setValues(usernameInputs, msg.username);
    setValues(passwordInputs, msg.password);
  });
}

function setValues(els, value) {
  if (els === null) return;
  for (let k = 0; k < els.length; k++) {
    el = els[k];
    const v = new Event("input", { bubbles: true });
    el.dispatchEvent(v);
    el.value = value;
    el.dispatchEvent(v);
    console.log("content: setValues: k= ", k, " value= ", value);
    navigator.clipboard
      .writeText(value)
      .then(() => console.log("content: setValues: clipboard copy success!"))
      .catch((err) =>
        console.error("content: setValues: clipboard copy error= ", err)
      );
  }
}
