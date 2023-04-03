window.addEventListener("load", run);

function findUserInputs(allInputs) {
  console.log("content: findUserInput: allInputs= ", allInputs);
  if (!allInputs) return null;
  let v = allInputs.filter((e) => {
    return e.type === "text";
  });
  if (v.length < 1) return null;
  v = v.filter((e) => {
    console.log("findUserInput: e= ", e);
    let x =
      e.id.toUpperCase().indexOf("USER") > -1 ||
      e.name.toUpperCase().indexOf("USER") > -1 ||
      e.placeholder.toUpperCase().indexOf("USER") > -1;
    if (x) {
      console.log("content: findUserInputs: found e= ", e);
      // alert(`content: findUserInputs: found!`);
    }
    return x;
  });
  return v.length > 0 ? v : null;
}

function findPasswordInputs(allInputs) {
  // console.log("content: findPasswordInput: allInputs= ", allInputs);
  if (!allInputs) return null;
  let v = allInputs.filter((e) => {
    return e.type === "password";
  });
  if (v.length > 0) console.log("findPasswordInputs: v= ", v);
  return v.length > 0 ? v : null;
}

function findEmailInputs(allInputs) {
  // console.log("content: findEmailInput: allInputs= ", allInputs);
  if (!allInputs) return null;
  let v = allInputs.filter((e) => {
    return e.type === "email";
  });
  if (v.length > 0) console.log("findEmailInputs: v= ", v);
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
all = getAllNodes(document.documentElement, null, null);
// a = getAllNodes(document.documentElement, "INPUT")

function run() {
  // alert("content: run: START");
  console.log("content: run: document.readyState= ", document.readyState);
  const allElements = getAllNodes(document.documentElement, null, null);
  const allInputElements = getAllNodes(document.documentElement);
  console.log("content: run: allElements.length= ", allElements.length);
  console.log(
    "content: run: allInputElements.length= ",
    allInputElements.length
  );
  if (allInputElements.length < 1) {
    // alert("content: no input elemets found!");
    return;
  }
  let emailInputs = findEmailInputs(allInputElements);
  let passwordInputs = findPasswordInputs(allInputElements);
  let usernameInputs = findUserInputs(allInputElements);
  if (!(emailInputs || passwordInputs || usernameInputs)) return;
  const msg = { from: "content", domain: document.domain };
  console.log("content: run:1: message for sw: msg= ", msg);
  chrome.runtime.sendMessage(msg);
  console.log("content: run:2: message for sw: msg= ", msg);
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("content: onMessage: msg= ", msg);
    setValues(emailInputs, msg.email);
    setValues(usernameInputs, msg.username);
    setValues(passwordInputs, msg.password);
  });
}

function setValues(els, value) {
  if (els === null) return;
  // console.log("content: setValues: value= ", value, " els.length= ", els.length);
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
  // alert(`setValues: value= ${value}`);
}
