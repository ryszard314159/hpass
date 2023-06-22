"use strict";
import { getPass, MAXLENGTH, MINLENGTH } from "./core/lib.js";

// navigator.clipboard.writeText fails in Safari
// https://developer.apple.com/forums/thread/691873

const SHORTPOPUP = 1e3; // short popup time
const LONGPOPUP = 1e5; // long popup time

const globalDefaults = {};
globalDefaults.pepper = "_";
globalDefaults.length = 15;
globalDefaults.clean = true;
globalDefaults.minlength = MINLENGTH;
globalDefaults.maxlength = MAXLENGTH;
globalDefaults.salt = null;

// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
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
el.version = document.getElementById("version");

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
        showPopup(msg, LONGPOPUP);
        console.log("app: register: opts=defaults= ", defaults);
      } else {
        console.log("app: register: exist already: opts= ", opts);
      }
      console.log("app: register: globalDefaults= ", globalDefaults);
      el.pepper.value = opts.pepper;
      el.salt.value = opts.salt;
      el.length.value = opts.length;
      el.length.min = opts.minlength;
      el.length.max = opts.maxlength;
      console.log("app: register: els set to opts= ", opts);
      //
      // NOTE: if you are working with DevTools
      //       make sure that the Bypass for Network checkbox
      //       is unchecked. If it is checked .controller will
      //       be null
      // See:
      // (1) https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controller
      //      "...This property returns null if the request is a force refresh..."
      // (2) https://www.youtube.com/watch?v=1d3KgacJv1I (Debugging Serviceworker Controller null)
      //
      if (navigator.serviceWorker.controller) {
        const msg = { type: "GET_VERSION" };
        console.log(
          `app: register: This page is currently controlled by: ${navigator.serviceWorker.controller}`
        );
        console.log("app: register: msg= ", msg);
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        console.log(
          "app: register: This page is not currently controlled by a service worker."
        );
      }
    })
    .catch(console.error("app: registration failed"));
}

navigator.serviceWorker.addEventListener("message", (event) => {
  console.log("app: message: event= ", event);
  if (event.data && event.data.type === "VERSION") {
    console.log("app: message: event.data= ", event.data);
    el.version.innerHTML = `HPASS Version ${event.data.version}`;
  }
});

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
function cleanHint(prompt) {
  let hint = prompt.toLowerCase();
  let domain = extractSecondaryDomain(hint);
  return domain;
}

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
  setTimeout(() => p.remove(), timeOut);
}

el.gear.addEventListener("click", () => {
  el.menu.classList.toggle("slide-in");
});

el.back.addEventListener("click", () => {
  el.menu.classList.toggle("slide-in");
});

const ops = ["pepper", "salt"];
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
  window.localStorage.setItem("options", JSON.stringify(opts));
  el.length.value = Math.max(Math.min(opts.length, MAXLENGTH), MINLENGTH);
  console.log("apps:1: save: opts= ", opts);
  showPopup("settings saved!", SHORTPOPUP);
});

el.demo.addEventListener("click", function () {
  console.log("app: demo: el= ", el);
  console.log("app: demo: globalDefaults= ", globalDefaults);
  el.pepper.value = globalDefaults.pepper;
  el.salt.value = globalDefaults.salt;
  el.length.value = globalDefaults.length;
  el.length.min = MINLENGTH;
  el.length.max = MAXLENGTH;
  console.log("app: demo: el.pepper.value= ", el.pepper.value);
  console.log("app: demo: el.salt.value= ", el.salt.value);
  console.log("app: demo: el.length.value= ", el.length.value);
  console.log("app: demo: el.length.min= ", el.length.min);
  console.log("app: demo: el.length.max= ", el.length.max);
  showPopup("defaults restored!", POPUPSHORT);
});

el.hint.addEventListener("mouseout", () => {
  console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  // if (cleaned) {
  console.log("app:1: mouseout: el.hint.value= ", el.hint.value);
  el.hint.value = cleanHint(el.hint.value); // cleaned);
  console.log("app:2: mouseout: el.hint.value= ", el.hint.value);
  console.log("app:3: mouseout: el.hint.value= ", el.hint.value);
});

el.generate.addEventListener("click", function () {
  toggleSize();
  navigator.vibrate(10);
  const opts = {};
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = Math.max(Math.min(el.length.value, MAXLENGTH), MINLENGTH);
  el.length.value = opts.length;
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
    showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
  } else {
    // Non-iOS device
    navigator.clipboard
      .writeText(passwd)
      .then(() => {
        console.log("app: non-iOS: clipboard copy success! passwd= ", passwd);
        showPopup(`${passwd}<br><br>copied to clipboard`, SHORTPOPUP);
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
