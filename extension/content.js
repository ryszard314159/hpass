window.addEventListener("load", run);
// window.addEventListener("load", () => {
//   setTimeout(() => run(), 900);
// }); // setTimeout.. delay helps for some sites

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

function run(runMessage) {
  console.log("content: run: runMessage= ", runMessage);
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

// chrome.extension.onRequest.addListener(function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (request.action == "checkFreeTrial") {
//     const isFreeTrial = chrome.storage.local.get("isFreeTrial");
//     const expiryDate = chrome.storage.local.get("expiryDate");
//     if (isFreeTrial && new Date() < expiryDate) {
//       sendResponse({
//         message: "You are currently in free trial mode.",
//       });
//     } else {
//       sendResponse({
//         message: "Your free trial has expired.",
//       });
//     }
//   }
// });

//
// Create an observer instance linked to the callback function
// const observer = new MutationObserver(callback);
// const observer = new MutationObserver((mutationList) => {
//   // for (const mutation of mutationList) {
//   //   if (mutation.type === "childList") {
//   //     console.log("content: observer: A child node has been added or removed.");
//   //   } else if (mutation.type === "attributes") {
//   //     console.log(
//   //       `content: observer: The ${mutation.attributeName} attribute was modified.`
//   //     );
//   //   }
//   // }
//   run("from observer");
// });
// Start observing the target node for configured mutations
// const targetNode = document.documentElement;
// Options for the observer (which mutations to observe)
// const config = { attributes: true, childList: true, subtree: true };
// observer.observe(targetNode, config);
// TODO: adding MutationObserver helps for some sites e.g. https://www.komoot.com
//       but not for others e.g. https://www.verizon.com/home/myverizon/
// Later, you can stop observing
// observer.disconnect();

// document.onclick = function (event) {
//   // Compensate for IE<9's non-standard event model
//   //
//   console.log("content: document.onclick: event= ", event);
//   if (event === undefined) event = window.event;
//   var target = "target" in event ? event.target : event.srcElement;
//   alert("clicked on " + target.tagName);
// };

// window.addEventListener("click", function (event) {
//   console.log("content: window.addEventListener: event= ", event);
//   if (event === undefined) event = window.event;
//   var target = "target" in event ? event.target : event.srcElement;
//   alert("clicked on " + target.tagName);
// });

// var monitor = setInterval(function () {
//   var elem = document.activeElement;
//   // if (elem && elem.tagName == "IFRAME") {
//   if (elem) {
//     clearInterval(monitor);
//     alert("clicked!");
//     console.log("monitor: elem=", elem);
//   }
// }, 100);

// const inputBoxes = document.getElementsByTagName("INPUT");
// const inputPressed = e => {
//   console.log("inputPressed: e.target.id= ", e.target.id);  // Get ID of Clicked Element
// };
// for (let inp of inputBoxes) {
//   inp.addEventListener("click", inputPressed);
// };
