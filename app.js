"use strict";
import { getPass } from "./core/lib.js";
// console.log("app: before uuidv4()");
// import { v4 as uuidv4 } from "uuid";
// const uid = uuidv4();
// console.log("app: uid= ", uid);

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

const default_opts = {
  pepper: "_",
  salt: null, // "top secret!",
  length: 15,
  clean: 1,
  maxlength: 64,
  minlength: 5,
  // burnin: 9,
  // maxburnin: 9999,
};

if ("serviceWorker" in navigator) {
  const swPath = "sw.js";
  console.log("apps: before registration: swPath= ", swPath);
  navigator.serviceWorker
    .register(swPath)
    .then((reg) => {
      console.log("app: sw registered!", reg);
      // const installChannel = new BroadcastChannel("installChannel");
      // alert("app: sw registered!");
      const oldSalt = window.localStorage.getItem("installSalt");
      if (oldSalt == null) {
        const salt = getPass({ hint: "", length: 8 });
        console.log("app: sw registered: : salt= ", salt);
        default_opts.salt = salt;
        console.log("app: sw registered: default_opts= ", default_opts);
        window.localStorage.setItem("installSalt", salt);
        alert(`apps: new installSalt= ${salt} saved`);
      } else {
        alert(`apps: old installSalt= ${oldSalt} detected`);
        default_opts.salt = oldSalt;
      }
      const opts = window.localStorage.getItem("options");
      if (opts == null) {
        window.localStorage.setItem("options", JSON.stringify(default_opts));
        alert("app: register: options set to default values on install");
        console.log("app: register: default_opts= ", default_opts);
      } else {
        alert("app: register: options set already");
      }
      // installChannel.onmessage = (event) => {
      //   alert("app: installChannel.onmessage!");
      //   console.log("app: installChannel.omessage: event= ", event);
      //   const value = event.data.install;
      //   console.log("app: installChannel.omessage: value= ", value);
      //   if (event.data.install) {
      //     const installSalt = getPass({ hint: "", length: 32 });
      //     console.log(
      //       "app: installChannel.onmessage: installSalt= ",
      //       installSalt
      //     );
      //     default_opts.salt = installSalt;
      //     console.log(
      //       "apps: installChannel.onmessage: default_opts= ",
      //       default_opts
      //     );
      //   }
      // };
    })
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

// const installChannel = new BroadcastChannel("installChannel");
// installChannel.onmessage = (event) => {
//   console.log("app: installChannel: event= ", event);
//   // value = event.data.key;
// };

function cleanLevel(level) {
  let v = null;
  const trueClean = new Set(["true", true, "1", 1]); // , "2", 2]);
  const falseClean = new Set(["false", false, "0", 0]);
  const highClean = new Set(["2", 2]);
  if (falseClean.has(level)) v = 0;
  if (trueClean.has(level)) v = 1;
  if (highClean.has(level)) v = 2;
  if (v === null) {
    console.log("WARNING: app: cleanLevel: invalid level= ", level);
    // v = 0;
    console.log("WARNING: app: cleanLevel: level set to= ", v);
  }
  return v;
}

function cleanLevelDisplay(level) {
  let v = null;
  if (level === 0) v = "false";
  if (level === 1) v = "true";
  if (level === 2) v = "2";
  console.log("app: cleanLevelDisplay: input level= ", level);
  console.log("app: cleanLevelDisplay: output v= ", v);
  return v;
}

// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.clean = document.getElementById("clean");
el.range = document.getElementById("range");
el.generate = document.getElementById("generate");
el.generateDiv = document.getElementById("generateDiv");
el.gear = document.getElementById("gear");
el.passwords = document.getElementById("passwords");
el.hide = document.getElementById("hide");
el.save = document.getElementById("save");
el.demo = document.getElementById("demo");
el.reset = document.getElementById("reset");
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
console.log("app:1: el= ", el);
console.log("app:1: el.length= ", el.length);
console.log("app:1: el.length.value= ", el.length.value);
console.log("app:1: el.clean= ", el.clean);
console.log("app:1: el.clean.value= ", el.clean.value);

// function resize(elem, percent) {
//   elem.style.fontSize = percent;
// }

// el.generate.addEventListener("mouseover", (x) => resize(x, "125%"));
// el.generate.addEventListener("mouseout", (x) => resize(x, "100%"));

// TODO: replace localStorage with Cache Storage
let opts = JSON.parse(window.localStorage.getItem("options"));
console.log("apps: from localStorage: opts= ", opts);
alert("app: from localStorage opts= ", JSON.stringify(opts));
// alert("app: default_opts= ", default_opts);
console.log("apps: default_opts= ", default_opts);
opts = opts === null ? default_opts : opts;
opts.clean = cleanLevel(opts.clean);
console.log("apps: after defaults applied: opts=", opts);
if (!opts.salt) {
  opts.salt = window.localStorage.getItem("installSalt");
  console.log("app: opts.salt was undefined, set to installSalt= ", opts.salt);
} else {
  console.log("app: opts.salt was defined= ", opts.salt);
}
console.log("apps: installSalt applied: opts=", opts);
// alert("app:1: opts= ", opts);
el.salt.value = opts.salt;
el.pepper.value = opts.pepper;
let n = Math.min(Math.max(opts.minlength, opts.length), opts.maxlength);
el.length.value = n;
el.length.min = opts.minlength;
el.length.max = opts.maxlength;
el.clean.value = cleanLevelDisplay(opts.clean);
if (n < opts.minlength || n > opts.maxlength) {
  alert(
    `Length (=${n}) must be between ${opts.minlength} and ${opts.maxlength}!`
  );
}
console.log("app:2: el.length.value= ", el.length.value);
console.log("app:2: el.clean.value= ", el.clean.value);

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

// cleaning level:
// 0 - leave prompt as is e.g. https://www.amazon.com
// 1 - extract domain e.g. amazon.com
// 2 - extract domain and drop top-level domain (TLD)
//     e.g. amazon
function cleanHint(prompt, level) {
  console.log("cleanHint: level= ", level, " prompt= ", prompt);
  console.log("cleanHint: typeof(level)= ", typeof level);
  if (level === 0) return prompt;
  let domain = extractNakedDomain(prompt);
  console.log("cleanHint: level= ", level, " domain= ", domain);
  if (level < 2) return domain.toLowerCase();
  const u = domain.split(".");
  const v = u.length > 1 ? u.at(-2) : domain;
  console.log("cleanHint: level= ", level, " v= ", v);
  return v.toLowerCase();
}

// function addElement() {
//   // create a new div element
//   const newDiv = document.createElement("div");

//   // and give it some content
//   const newContent = document.createTextNode("Hi there and greetings!");

//   // add the text node to the newly created div
//   newDiv.appendChild(newContent);

//   // add the newly created element and its content into the DOM
//   const currentDiv = document.getElementById("div1");
//   document.body.insertBefore(newDiv, currentDiv);
// }

// // Create a new web element
// var newElement = document.createElement('p');
// newElement.textContent = 'This is a new paragraph element!';

// // Add the new element to the document body
// document.body.appendChild(newElement);

// // Add a click event listener to the button
// var button = document.getElementById('myButton');
// button.addEventListener('click', function() {
//   alert('Button clicked!');
// });

function showPopup(msg) {
  const p = document.createElement("p");
  p.innerHTML = msg;
  p.style.display = "block";
  p.style.fontSize = "1.5rem";
  p.style.backgroundColor = "lightgreen";
  p.style.zIndex = 99;
  p.style.position = "absolute";
  p.style.width = "66%";
  p.style.textAlign = "center";
  p.style.borderRadius = "15px";
  p.style.padding = "1rem 0 1rem 0";
  document.documentElement.appendChild(p);
  // setTimeout(function () {popup.style.display = "none";}, 2000); // Close the popup after 5 seconds
  setTimeout(() => p.remove(), 3000);
}

// function htmlToUni(x) {
//   const divElement = document.createElement("div");
//   divElement.innerHTML = x;
//   return divElement.textContent;
// }

// const toggleButton = document.getElementById("toggle-menu");
// const menu = document.getElementById("menu");
// toggleButton.addEventListener("click", () => {
//   menu.classList.toggle("slide-in");
// &#x274C; CROSS MARK

// const burgers = ["leftBurger", "rightBurger"];
// burgers.forEach((x) => {
el.gear.addEventListener("click", () => {
  // console.log(`app: ${x} clicked...`);
  el.menu.classList.toggle("slide-in");
  // burgers.forEach((y) => {
  // console.log(`app: ${y} innerHTML= `, el[y].innerHTML);
  // console.log(`app: ${y} innerHTML= ${el[y].innerHTML}`);
  // console.log(
  //   `app: ${y} innerHTML.toString()= ${el[y].innerHTML.toString()}`
  // );
  // const uCross = "&#x274C;"; // unicode for CROSS
  // const uBurger = "&#9776;"; // unicode for HAMBURGER
  // const uBurger = "☰";
  // const uCross = "❌";
  // console.log(`app: uCross= ${uCross}, uBurger= ${uBurger}`);
  // el[y].innerHTML = el[y].innerHTML == uBurger ? uCross : uBurger;
});

el.back.addEventListener("click", () => {
  el.menu.classList.toggle("slide-in");
});

// const crosses = ["pepperCross", "saltCross", "lengthCross", "cleanCross"];
const ops = ["pepper", "salt", "length", "clean"];
ops.forEach((x) => {
  let cross = `${x}Cross`;
  console.log("app:0: ops.forEach: x= ", x, " cross= ", cross);
  el[cross].addEventListener("click", () => {
    console.log("app:1: ops.forEach: x= ", x, " cross= ", cross);
    el[x].value = null;
  });
});

// const slideOut = ["generateDiv"];
// slideOut.forEach((x) => {
//   el[x].addEventListener("click", () => {
//     el.menu.classList.remove("slide-in");
//   });
// });

// el.hintButton.addEventListener("click", (event) => {
//   event.preventDefault();
//   el.hintButton.innerHTML = el.hintButton.innerHTML === "raw" ? "clean" : "raw";
// });

// el.hide.addEventListener("click", function () {
//   const htmlEncoding = ["&#128065;", "&#129296;"]; // SHOW HIDE
//   const [show, hide] = htmlEncoding.map((x) => htmlToUni(x));
//   // const hide = "hide"; // 👁
//   // const show = "show"; // 🤐
//   el.hide.innerHTML = el.hide.innerHTML === show ? hide : show;
//   // el.hint.type = el.hint.type === "password" ? "text" : "password";
//   // let els = ["saltRow", "pepperRow", "lengthRow", "burninRow", "passwordsRow"];
//   let ids = [
//     "help",
//     "saltForm",
//     "pepperForm",
//     "lengthForm",
//     "saveDiv",
//     "passwords",
//   ];
//   for (let id of ids) {
//     console.log("app: id= ", id);
//     document.getElementById(id).classList.toggle("hidden");
//   }
//   document.getElementById("generate").classList.toggle("rounded-bottom");
// });

el.save.addEventListener("click", function () {
  console.log("apps:0: save: opts= ", opts);
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = el.length.value;
  opts.clean = cleanLevel(el.clean.value);
  window.localStorage.setItem("options", JSON.stringify(opts));
  el.clean.value = cleanLevelDisplay(opts.clean);
  console.log("apps:1: save: opts= ", opts);
  console.log("apps:1: save: el.clean.value= ", el.clean.value);
  showPopup("settings saved!");
});

el.demo.addEventListener("click", function () {
  console.log("app: demo: el= ", el);
  el.pepper.value = default_opts.pepper;
  el.salt.value = default_opts.salt;
  el.length.value = default_opts.length;
  el.clean.value = cleanLevelDisplay(default_opts.clean);
});

el.reset.addEventListener("click", function () {
  console.log("app: reset: el= ", el);
  el.pepper.value = null;
  el.salt.value = null;
  el.length.value = null;
  el.clean.value = null;
});

// el.sidebar.addEventListener("focusout", () => {
//   console.log("app: sidebar focusout event...");
//   el.sidebar.style.display = "none";
// });

// el.hint.addEventListener("click", () => {
//   console.log("app: sidebar focusout event...");
//   el.sidebar.style.display = "none";
// });

el.hint.addEventListener("mouseout", () => {
  // if (el.hintButton.innerHTML === "raw") return;
  // el.hint.value = el.clean.value ? cleanHint(el.hint.value) : el.hint.value;
  const cleaned = cleanLevel(el.clean.value);
  console.log("app:0: mouseout: el.clean.value= ", el.clean.value);
  console.log(
    "app:0: mouseout: type of el.clean.value= ",
    typeof el.clean.value
  );
  console.log("app:0: mouseout: cleaned= ", cleaned);
  console.log("app:0: mouseout: type of cleaned= ", typeof cleaned);
  console.log("app:0: museout:: el.hint.value= ", el.hint.value);
  if (cleaned) {
    console.log("app:1: mouseout: el.clean.value= ", el.clean.value);
    el.hint.value = cleanHint(el.hint.value, cleaned);
    console.log("app:1: mouseout: el.hint.value= ", el.hint.value);
  } else {
    console.log("app:2: mouseout: el.clean.value= ", el.clean.value);
  }
  console.log("app:3: mouseout: el.clean.value= ", el.clean.value);
  console.log("app:3: mouseout: el.hint.value= ", el.hint.value);
});

el.generate.addEventListener("click", function () {
  console.log("generate:0: opts.burnin=", opts.burnin);
  // grow();
  // setTimeout(shrink, 500);
  toggleSize();
  navigator.vibrate(10);
  opts.pepper = el.pepper.value;
  opts.salt = el.salt.value;
  opts.length = el.length.value;
  opts.clean = el.clean.value;
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
  // document.getElementById("passwords").prepend(passwd + "\n");
  navigator.clipboard
    .writeText(passwd)
    .then(() => {
      // alert(`app: before openNotify: coppied password= ${passwd}`);
      // openNotify();
      // alert(`app: after openNotify: coppied password= ${passwd}`);
      console.log("app: clipboard copy success! passwd= ", passwd);
    })
    .catch((err) => console.error("app: clipboard copy error= ", err));
  showPopup(`${passwd}<br><br>copied to clipboard`);
});

function toggleSize() {
  el.generate.classList.add("active");
  setTimeout(function () {
    el.generate.classList.remove("active");
  }, 100);
}

// function grow() {
//   // add grow to class list
//   el.generate.classList.add("grow");
// }

// function shrink() {
//   // add grow to class list
//   el.generate.classList.remove("grow");
//   // el.generate.classList.add("shrink");
//   // setTimeout(shrink, 500);
// }

// Function to open the modal and start the timer
// function openNotify() {
//   // alert(`app: inside openNotify!!!`);
//   el.notify.style.display = "block";
//   el.notify.style.backgroundColor = "red";
//   console.log(
//     "app: openNotify: el.notify.style.display= ",
//     el.notify.style.display
//   );
//   console.log(
//     "app: openNotify: el.notify.style.zIndex= ",
//     el.notify.style.zIndex
//   );
//   setTimeout(closeNotify, 500);
// }
// function closeNotify() {
//   el.notify.style.display = "none";
// }
// window.addEventListener('load', openNotify);
