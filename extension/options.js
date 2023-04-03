const MAXLENGTH = 128;
const MINLENGTH = 4;
const optsDefaults = {};
const optsKeys = ["salt", "pepper", "length", "email", "username"];
optsDefaults.salt = { value: "top secret!", icon: "&#129323;" };
optsDefaults.pepper = { value: "_", icon: "&#127798;" };
optsDefaults.length = { value: 15, icon: "&#128207;" };
optsDefaults.email = { value: "donkey@winnie.pooh", icon: "&#128231;" };
optsDefaults.username = { value: "eeore", icon: "&#128100;" };
const el = {};
const opts = {};
optsKeys.forEach((k) => {
  el[k] = document.getElementById(k); // select options.html web elements
  opts[k] = el[k].value;
});
// add other elements from options page...
["reset", "save", "demo"].forEach((k) => {
  el[k] = document.getElementById(k);
});

function setElements() {
  chrome.storage.local.get(["options"], (results) => {
    console.log("options: setElements: local.get: opts= ", opts);
    console.log(`options: setElements: results.options= ${results.options}`);
    optsKeys.forEach((k) => (el[k].value = opts[k] = results.options[k]));
  });
}

chrome.runtime
  .openOptionsPage()
  .then(setElements, (error) => console.log(`Error: ${error}`));

// save current options in local storage
// const backgroundPage = chrome.extension.getBackgroundPage();

// // Send a message to the background script
// backgroundPage.chrome.runtime.sendMessage({ greeting: "Hello from the options page!" });

/**
 *
 */
function saveOptions() {
  // const MINLENGTH = 4;
  // const MAXLENGTH = 128;
  optsKeys.forEach((x) => {
    opts[x] = el[x].value;
  });
  // let msg = { from: "options", get: "length range" };
  // console.log("options: saveOptions: sending msg= ", msg);
  // const backgroundPage = chrome.runtime.getBackgroundPage();
  // console.log("options: saveOptions: backgroundPage= ", backgroundPage);
  // backgroundPage.chrome.runtime.sendMessage(msg);
  // chrome.runtime.onMessage.addListener((length) => {
  //   console.log("options: saveOptions: from sw: length= ", length);
  // let x = `options: saveOptions: from sw: min= ${length.min}, max= ${length.max}`;
  // console.log(x);
  // let { MINLENGTH = min, MAXLENGTH = max } = length;
  chrome.storage.local.get(["config"], (results) => {
    console.log("options: saveOptions: results= ", results);
    let { MAXLENGTH, MINLENGTH } = results.config;
    console.log(
      `options: saveOptions: MAXLENGTH= ${MAXLENGTH}, MINLENGTH= ${MINLENGTH}`
    );
    let corrected = Math.max(MINLENGTH, Math.min(opts.length, MAXLENGTH));
    let v = `options: saveOptions: opts.length= ${opts.length}, corrected= ${corrected}`;
    console.log(v);
    if (opts.length != corrected) {
      el.length.value = opts.length = corrected;
    }
    chrome.storage.local.set({ options: opts });
  });
  // });
  // checkOptions();
}

function resetOptions() {
  optsKeys.forEach((x) => {
    el[x].value = "";
  });
}

function defaultOptions() {
  optsKeys.forEach((x) => {
    el[x].value = optsDefaults[x].value;
  });
}

el.save.addEventListener("click", saveOptions);
el.reset.addEventListener("click", resetOptions);
el.defaults.addEventListener("click", defaultOptions);

//
// *** possibly to add later as a popup modal window
// *** to alert user to errors in options before
// *** storing them
//
// function createModalAlert(txt) {
//   const v = `<div id="myModal" class="modal">
//   <div class="modal-content">
//     <span class="close">&times;</span>
//     <p>${txt}</p>
//   </div>
// </div>`;
//   return v;
// }

// function addElement(txt) {
//   // create a new div element
//   const newDiv = document.createElement("div");

//   // and give it some content
//   const newContent = document.createTextNode(txt);

//   // add the text node to the newly created div
//   newDiv.appendChild(newContent);

//   // add the newly created element and its content into the DOM
//   const optionsBox = document.getElementById("options");
//   document.body.insertBefore(newDiv, optionsBox);
// }

// function checkOptions() {
//   chrome.storage.local.get(["options"], (results) => {
//     let errMsg = "ERROR";
//     let nerr = 0;
//     let ntot = 0;
//     const opts = {};
//     console.log("options: checkOptions: results.options= ", results.options);
//     optsKeys.forEach((k) => {
//       ntot++;
//       let o = (opts[k] = results.options[k]);
//       let msg = `options: checkOptions: k= ${k}, o= ${o}, typeof(o)= ${typeof o}`;
//       console.log(msg);
//       if (el[k].value !== o) nerr++;
//       if (o.length == "") {
//         nerr++;
//         errMsg += `: ${k} is undefined`;
//       }
//     });
//     let x = opts.length;
//     if (Number(x) != x || x < MINLENGTH || x > MAXLENGTH) {
//       nerr++;
//       errMsg += `: length (=${opts.length}) must be an integer in ${MINLENGTH} - ${MAXLENGTH} range`;
//       console.log(
//         `options: checkOptions: length (=${opts.length}) must be an integer in ${MINLENGTH} - ${MAXLENGTH} range`
//       );
//     }
//     console.log(`options: checkOptions: nerr= ${nerr}, ntot= ${ntot}`);
//     // https://stackoverflow.com/questions/37335887/show-alert-from-chrome-extension-options-ui-page
//     // alert() does not work from options_ui page - apparently a bug?
//     if (nerr > 0) alert(errMsg);
//     if (nerr > 0) {
//       let alertModal = createModalAlert(errMsg);
//       // addElement(errMsg);
//     }
//   });
// }
