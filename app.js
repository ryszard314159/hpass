"use strict";
import { getPass, MAXLENGTH, MINLENGTH } from "./core/lib.js";

// navigator.clipboard.writeText fails in Safari
// https://developer.apple.com/forums/thread/691873

// const MAXCLEAN = 2;
// const MINCLEAN = 0;
const POPUPSHORT = 1e3; // short popup time
const POPUPLONG = 1e5; // long popup time

const globalDefaults = {};
globalDefaults.pepper = "_";
globalDefaults.length = 15;
globalDefaults.clean = true;
globalDefaults.minlength = 5;
globalDefaults.maxlength = 64;
globalDefaults.salt = null;

// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
// el.clean = document.getElementById("clean");
el.range = document.getElementById("range");
el.generate = document.getElementById("generate");
el.generateDiv = document.getElementById("generateDiv");
el.gear = document.getElementById("gear");
el.passwords = document.getElementById("passwords");
el.hide = document.getElementById("hide");
el.save = document.getElementById("save");
el.demo = document.getElementById("demo");
el.hintButton = document.getElementById("hintButton");
el.back = document.getElementById("back");
el.menu = document.getElementById("menu");
el.more = document.getElementById("more");
el.menuList = document.getElementById("menuList");
el.notify = document.getElementById("notify");
el.pepperCross = document.getElementById("pepperCross");
el.saltCross = document.getElementById("saltCross");
el.lengthCross = document.getElementById("lengthCross");
el.cleanCross = document.getElementById("cleanCross");

if ("serviceWorker" in navigator) {
  const swPath = "sw.js";
  console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => {
      const defaults = { ...globalDefaults };
      const salt = getPass({ hint: "", length: 8 });
      defaults.salt = salt;
      globalDefaults.salt = salt;
      console.log("app: sw registered!", reg);
      let opts = JSON.parse(window.localStorage.getItem("options"));
      if (opts == null) {
        opts = defaults;
        window.localStorage.setItem("options", JSON.stringify(opts));
        let msg = `installation: your personalized secret is ${salt}`;
        msg = msg + "<br>NOTE: you can change it later if you whish";
        alert("app: register: options set to default values on install");
        showPopup(msg, POPUPLONG);
        console.log("app: register: opts=defaults= ", defaults);
      } else {
        console.log("app: register: exist already: opts= ", opts);
      }
      console.log("app: register: globalDefaults= ", globalDefaults);
      el.pepper.value = opts.pepper;
      el.salt.value = opts.salt;
      el.length.value = opts.length;
      // el.clean.value = opts.clean;
      el.length.min = opts.minlength;
      el.length.max = opts.maxlength;
      console.log("app: register: els set to opts= ", opts);
    })
    .catch(console.error("app: registration failed"));
}

// function cleanLevel(level) {
// const trueClean = new Set(["true", true, "1", 1]); // , "2", 2]);
// const falseClean = new Set(["false", false, "0", 0]);
// const highClean = new Set(["2", 2]);
// if (falseClean.has(level)) v = false;
// if (trueClean.has(level)) v = true;
// if (highClean.has(level)) v = 2;
// if (v === null) {
//   console.log("WARNING: app: cleanLevel: invalid level= ", level);
//   v = true;
//   console.log("WARNING: app: cleanLevel: level set to= ", v);
// }
//   return Math.max(Math.min(level, 2), 0);
// }

// function cleanLevelDisplay(level) {
//   let v = null;
//   if (level === 0) v = "false";
//   if (level === 1 || level) v = "true";
//   if (level === 2) v = "2";
//   console.log("app: cleanLevelDisplay: input level= ", level);
//   console.log("app: cleanLevelDisplay: output v= ", v);
//   return v;
// }

// TODO: replace localStorage with Cache Storage
// let opts = JSON.parse(window.localStorage.getItem("options"));
// console.log("apps: from localStorage: opts= ", opts);
// opts.clean = cleanLevel(opts.clean);
// console.log("apps: after defaults applied: opts=", opts);
// el.salt.value = opts.salt;
// el.pepper.value = opts.pepper;
// let n = Math.min(Math.max(opts.minlength, opts.length), opts.maxlength);
// el.length.value = n;
// el.length.min = opts.minlength;
// el.length.max = opts.maxlength;
// el.clean.value = cleanLevelDisplay(opts.clean);
// if (n < opts.minlength || n > opts.maxlength) {
//   alert(
//     `Length (=${n}) must be between ${opts.minlength} and ${opts.maxlength}!`
//   );
// }
// console.log("app:2: el.length.value= ", el.length.value);
// console.log("app:2: el.clean.value= ", el.clean.value);

// el.more.addEventListener("click", function () {
//   el.more.preventDefault();
//   let h = screen.height;
//   let w = screen.width;
//   window.open(
//     `./more.html`,
//     "popUpWindow",
//     `height=${h / 2}, width=${w / 2}, left=${w / 4}, top=${h / 4}`
//   );
// });

// 1. convert promp string to lower case
// 2. extract only domain e.g. http://www.domain.com -> domain

// Remove the protocol (e.g., "http://", "https://")
// Remove www prefix, if present
// Extract the domain name (excluding subdomains and paths)
// Remove subdomains
// function extractNakedDomain(url) {
//   const regex = /^https?:\/\/([a-z0-9]+\.)+[a-z0-9]+(\/.*)?$/;
//   let domain = url.replace(/^https?:\/\//i, "");
//   domain = domain.replace(/^www\./i, "");
//   domain = domain.split("/")[0];
//   const parts = domain.split(".");
//   if (parts.length > 2) {
//     parts.shift();
//   }
//   return parts.join(".");
// }

function extractSecondaryDomain(x) {
  const regex = /^https?:\/\/([a-z0-9]+\.)+[a-z0-9]+(\/.*)?$/;
  if (!regex.test(x)) return x; // no url found, return as is
  let a = x.replace(/^https?:\/\//i, ""); // drop leading https?://
  let b = a.replace(/\/.*$/, ""); // remove tail i.e. from the first / to the end
  let c = b.split("."); // split on .
  if (c.length < 2) return b;
  let d = c.slice(-2, -1)[0];
  return d;
}

// cleaning level:
// 0 - leave prompt as is e.g. https://www.amazon.com
// 1 - extract domain e.g. amazon.com
// 2 - extract domain and drop top-level domain (TLD)
//     e.g. amazon
// function cleanHint(prompt, level) {
//   console.log("cleanHint: level= ", level, " prompt= ", prompt);
//   console.log("cleanHint: typeof(level)= ", typeof level);
//   if (level === 0) return prompt;
//   let domain = extractNakedDomain(prompt);
//   console.log("cleanHint: level= ", level, " domain= ", domain);
//   if (level < 2) return domain.toLowerCase();
//   const u = domain.split(".");
//   const v = u.length > 1 ? u.at(-2) : domain;
//   console.log("cleanHint: level= ", level, " v= ", v);
//   return v.toLowerCase();
// }

function cleanHint(prompt) {
  let hint = prompt.toLowerCase();
  let domain = extractSecondaryDomain(hint);
  return domain;
}

// .ribbon {
//   position: relative;
//   top: -16px;
//   right: -706px;
// }

// <div id="content">
//   <img src="images/ribbon.png" class="ribbon"/>
//   <div>some text...</div>
// </div>

function showPopup(msg, timeOut) {
  const p = document.createElement("p");
  p.innerHTML = msg;
  p.style.display = "block";
  p.style.fontSize = "1.5rem";
  p.style.backgroundColor = "lightgreen";
  p.style.border = "0.1px solid black";
  p.style.zIndex = 99;
  p.style.position = "absolute";
  p.style.width = "80%";
  p.style.textAlign = "center";
  p.style.borderRadius = "15px";
  p.style.padding = "1rem 0 1rem 0";
  p.style.position = "absolute";
  // width:140px;overflow:auto
  p.style.overflow = "auto";
  const x = document.createElement("button");
  x.innerHTML = "X";
  x.style.position = "absolute";
  x.style.top = "4";
  x.style.right = "4";
  x.style.backgroundColor = "transparent";
  x.style.border = "0px solid black";
  p.appendChild(x);
  document.documentElement.appendChild(p);
  x.addEventListener("click", () => {
    p.remove();
  });
  // setTimeout(function () {popup.style.display = "none";}, 2000); // Close the popup after 5 seconds
  setTimeout(() => p.remove(), timeOut);
}

el.gear.addEventListener("click", () => {
  el.menu.classList.toggle("slide-in");
});

el.back.addEventListener("click", () => {
  el.menu.classList.toggle("slide-in");
});

const ops = ["pepper", "salt"]; // "length"]; "clean"];
ops.forEach((x) => {
  let cross = `${x}Cross`;
  console.log("app:0: ops.forEach: x= ", x, " cross= ", cross);
  el[cross].addEventListener("click", () => {
    console.log("app:1: ops.forEach: x= ", x, " cross= ", cross);
    el[x].value = null;
  });
});

function cleanClean(v) {
  const valid = new Set(["true", "false", true, false, 0, 1, "0", "1"]);
  return valid.has(v) ? v : true;
}

el.save.addEventListener("click", function () {
  const opts = { ...globalDefaults };
  console.log("apps:0: save: opts= ", opts);
  console.log("apps:0: save: MINLENGTH=", MINLENGTH, " MAXLENGTH= ", MAXLENGTH);
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  // opts.clean = Math.max(Math.min(el.clean.value, MAXCLEAN), MINCLEAN);
  // opts.clean = cleanClean(el.clean.value);
  // el.clean.value = opts.clean;
  window.localStorage.setItem("options", JSON.stringify(opts));
  el.length.value = opts.length;
  // el.clean.value = opts.clean;
  console.log("apps:1: save: opts= ", opts);
  // console.log("apps:1: save: el.clean.value= ", el.clean.value);
  showPopup("settings saved!", POPUPSHORT);
});

el.demo.addEventListener("click", function () {
  console.log("app: demo: el= ", el);
  console.log("app: demo: globalDefaults= ", globalDefaults);
  el.pepper.value = globalDefaults.pepper;
  el.salt.value = globalDefaults.salt;
  el.length.value = globalDefaults.length;
  // el.clean.value = globalDefaults.clean;
  el.length.min = MINLENGTH;
  el.length.max = MAXLENGTH;
  console.log("app: demo: el.pepper.value= ", el.pepper.value);
  console.log("app: demo: el.salt.value= ", el.salt.value);
  console.log("app: demo: el.length.value= ", el.length.value);
  // console.log("app: demo: el.clean.value= ", el.clean.value);
  console.log("app: demo: el.length.min= ", el.length.min);
  console.log("app: demo: el.length.max= ", el.length.max);
});

el.hint.addEventListener("mouseout", () => {
  // const cleaned = Math.max(Math.min(el.clean.value, MAXCLEAN), MINCLEAN);
  // const cleaned = el.clean.value;
  // console.log("app:0: mouseout: el.clean.value= ", el.clean.value);
  // console.log(
  //   "app:0: mouseout: type of el.clean.value= ",
  //   typeof el.clean.value
  // );
  // console.log("app:0: mouseout: cleaned= ", cleaned);
  // console.log("app:0: mouseout: type of cleaned= ", typeof cleaned);
  console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  // if (cleaned) {
  console.log("app:1: mouseout: el.hint.value= ", el.hint.value);
  el.hint.value = cleanHint(el.hint.value); // cleaned);
  console.log("app:2: mouseout: el.hint.value= ", el.hint.value);
  // } else {
  //   console.log("app:2: mouseout: el.clean.value= ", el.clean.value);
  // }
  // console.log("app:3: mouseout: el.clean.value= ", el.clean.value);
  console.log("app:3: mouseout: el.hint.value= ", el.hint.value);
});

el.generate.addEventListener("click", function () {
  toggleSize();
  navigator.vibrate(10);
  const opts = {};
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = el.length.value;
  // opts.clean = cleanClean(el.clean.value);
  // el.clean.value = opts.clean;
  window.localStorage.setItem("options", JSON.stringify(opts));
  let args = { ...opts }; // deep copy
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
  // document.getElementById("passwords").prepend(passwd + "\n");
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    // iOS device
    const x = document.createElement("textarea");
    x.value = passwd;
    document.body.appendChild(x);
    x.select();
    x.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy");
    document.body.removeChild(x);
    console.log("app: iOS: clipboard copy success! passwd= ", passwd);
    showPopup(`${passwd}<br><br>copied to clipboard`, POPUPSHORT);
  } else {
    // Non-iOS device
    navigator.clipboard
      .writeText(passwd)
      .then(() => {
        console.log("app: non-iOS: clipboard copy success! passwd= ", passwd);
        showPopup(`${passwd}<br><br>copied to clipboard`, POPUPSHORT);
      })
      .catch((err) => console.error("app: clipboard copy error= ", err));
  }
});

function toggleSize() {
  el.generate.classList.add("active");
  setTimeout(function () {
    el.generate.classList.remove("active");
  }, 100);
}

// if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
//   // iOS device
//   const el = document.createElement("textarea");
//   el.value = passwd;
//   document.body.appendChild(el);
//   el.select();
//   el.setSelectionRange(0, 99999); // For mobile devices
//   document.execCommand("copy");
//   document.body.removeChild(el);
//   console.log("app: clipboard copy success! passwd= ", passwd);
//   showPopup(`${passwd}<br><br>copied to clipboard`, POPUPSHORT);
// } else {
//   // Non-iOS device
//   navigator.clipboard
//     .writeText(passwd)
//     .then(() => {
//       console.log("app: clipboard copy success! passwd= ", passwd);
//       showPopup(`${passwd}<br><br>copied to clipboard`, POPUPSHORT);
//     })
//     .catch((err) => console.error("app: clipboard copy error= ", err));
// }
