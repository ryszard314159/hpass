"use strict";

import { getPass } from "./core/lib.js";

// function detectPageLoad() {
//   if (
//     window.performance &&
//     window.performance.timing &&
//     window.performance.timing.loadEventEnd
//   ) {
//     console.log("app: detectPageLoad: Page loaded");
//     // Do something
//   } else {
//     setTimeout(detectPageLoad, 100);
//   }
// }

// detectPageLoad();

// document.addEventListener("visibilitychange", () => {
//   alert("app: document visibilitychange event");
//   console.log("app: visibilitychange event= ", e);
// });

// window.onload = function () {
//   // This code will execute when any page has finished loading
//   console.log("app: window.onload event");
// };

if ("serviceWorker" in navigator) {
  const swPath = "sw.js";
  console.log("apps: bbbbefore registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => console.log("app: sw registered!", reg))
    .catch(console.error("app: registration failed"));
}

// fetch("test.json")
//   .then(response => response.json())
//   .then(json => console.log(json));
// All modern browsers support Fetch API. (Internet Explorer doesn't, but Edge does!)

// or with async/await

// async function printJSON() {
//   const response = await fetch("./settings.json");
//   const json = await response.json();
//   console.log("printJSON: json= ", json);
// }
// printJSON();

const default_opts = {
  pepper: "_",
  salt: "top secret!",
  length: 15,
  maxlength: 64,
  minlength: 5,
  // burnin: 9,
  // maxburnin: 9999,
};
// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.range = document.getElementById("range");
el.generate = document.getElementById("generate");
el.passwords = document.getElementById("passwords");
el.hide = document.getElementById("hide");
el.help = document.getElementById("help");
el.info = document.getElementById("info");
el.save = document.getElementById("save");
el.demo = document.getElementById("demo");
el.reset = document.getElementById("reset");
el.hintButton = document.getElementById("hintButton");

// TODO: replace localStorage with Cache Storage
let opts = JSON.parse(window.localStorage.getItem("options"));
console.log("from localStorage: opts= ", opts);
opts = opts === null ? default_opts : opts;
console.log("after defaults applied: opts=", opts);
el.salt.value = opts.salt;
el.pepper.value = opts.pepper;
let n = Math.min(Math.max(opts.minlength, opts.length), opts.maxlength);
el.length.value = n;
el.length.min = opts.minlength;
el.length.max = opts.maxlength;
if (n < opts.minlength || n > opts.maxlength) {
  alert(
    `Length (=${n}) must be between ${opts.minlength} and ${opts.maxlength}!`
  );
}

["help", "info"].forEach((x) => {
  let e = el[x];
  e.addEventListener("click", function () {
    let h = screen.height;
    let w = screen.width;
    window.open(
      `./${x}.html`,
      "popUpWindow",
      `height=${h / 2}, width=${w / 2}, left=${w / 4}, top=${h / 4}`
    );
  });
});

// 1. convert promp string to lower case
// 2. extract only domain e.g. http://www.domain.com -> domain

// Remove the protocol (e.g., "http://", "https://")
// Remove www prefix, if present
// Extract the domain name (excluding subdomains and paths)
// Remove subdomains
function extractNakedDomain(url) {
  let domain = url.replace(/^https?:\/\//i, "");
  domain = domain.replace(/^www\./i, "");
  domain = domain.split("/")[0];
  const parts = domain.split(".");
  if (parts.length > 2) {
    parts.shift();
  }
  return parts.join(".");
}

function cleanHint(prompt) {
  let domain = extractNakedDomain(prompt);
  // return domain.split(".")[0].toLowerCase();
  return domain.split(".").at(-2).toLowerCase();
}

function htmlToUni(x) {
  const divElement = document.createElement("div");
  divElement.innerHTML = x;
  return divElement.textContent;
}

el.hintButton.addEventListener("click", (event) => {
  event.preventDefault();
  el.hintButton.innerHTML = el.hintButton.innerHTML === "raw" ? "clean" : "raw";
});

el.hide.addEventListener("click", function () {
  const htmlEncoding = ["&#128065;", "&#129296;"]; // SHOW HIDE
  const [show, hide] = htmlEncoding.map((x) => htmlToUni(x));
  // const hide = "hide"; // 👁
  // const show = "show"; // 🤐
  el.hide.innerHTML = el.hide.innerHTML === show ? hide : show;
  // el.hint.type = el.hint.type === "password" ? "text" : "password";
  // let els = ["saltRow", "pepperRow", "lengthRow", "burninRow", "passwordsRow"];
  let ids = [
    "help",
    "saltForm",
    "pepperForm",
    "lengthForm",
    "saveDiv",
    "passwords",
  ];
  for (let id of ids) {
    console.log("app: id= ", id);
    document.getElementById(id).classList.toggle("hidden");
  }
  document.getElementById("generate").classList.toggle("rounded-bottom");
});

el.save.addEventListener("click", function () {
  window.localStorage.setItem("options", JSON.stringify(opts));
});

el.demo.addEventListener("click", function () {
  el.pepper.value = default_opts.pepper;
  el.salt.value = default_opts.salt;
  el.length.value = default_opts.length;
});

el.reset.addEventListener("click", function () {
  el.pepper.value = null;
  el.salt.value = null;
  el.length.value = null;
});

el.hint.addEventListener("mouseout", () => {
  if (el.hintButton.innerHTML === "raw") return;
  el.hint.value = cleanHint(el.hint.value);
});

el.generate.addEventListener("click", function () {
  console.log("generate:0: opts.burnin=", opts.burnin);
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = el.length.value;
  // opts.burnin = el.burnin.value;
  // TODO: replace localStorage with Cache Storage
  window.localStorage.setItem("options", JSON.stringify(opts));
  let args = { ...opts }; // deep copy
  // args.hint =
  //   el.raw.innerHTML === "raw" ? el.hint.value : cleanHint(el.hint.value);
  args.hint = el.hint.value;
  console.log("generate:1: opts=", opts);
  args.digits = false;
  args.unicode = false;
  args.digits = false;
  args.lower = false;
  args.upper = false;
  args.punctuation = false;
  args.no_shuffle = false;
  args.debug = true;
  args.verbose = true;
  let passwd = getPass(args);
  document.getElementById("passwords").prepend(passwd + "\n");
  navigator.clipboard
    .writeText(passwd)
    .then(() => {
      // alert(`app: coppied password= ${passwd}`);
      console.log("app: clipboard copy success! passwd= ", passwd);
    })
    .catch((err) => console.error("app: clipboard copy error= ", err));
});
