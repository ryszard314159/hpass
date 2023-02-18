"use strict";

const default_opts = {
  salt: "SALT",
  pepper: "@",
  length: 15,
  maxlength: 64,
  minlength: 5,
  burnin: 9,
  maxburnin: 9999,
};
// Selecting elements
const el = {};
el.hint = document.getElementById("hint");
el.salt = document.getElementById("salt");
el.pepper = document.getElementById("pepper");
el.length = document.getElementById("length");
el.burnin = document.getElementById("burnin");
el.range = document.getElementById("range");
el.generate = document.getElementById("generate");
el.passwords = document.getElementById("passwords");
el.hide = document.getElementById("hide");
el.help = document.getElementById("help");
el.info = document.getElementById("info");

let opts = JSON.parse(window.localStorage.getItem("options"));
console.log("from localStorage: opts= ", opts);
opts = opts === null ? default_opts : opts;
console.log("after defaults applied: opts=", opts);
el.salt.value = opts.salt;
el.pepper.value = opts.pepper;
el.burnin.value = opts.burnin;
el.burnin.min = 0;
el.burnin.max = opts.maxburnin;
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

// ["click", "mousemove"].forEach((event) => {
["mousemove"].forEach((event) => {
  el.salt.addEventListener(event, function () {
    opts.salt = el.salt.value;
  });
});

el.pepper.addEventListener("mousemove", function () {
  console.log("el.pepper.value= ", el.pepper.value);
  opts.pepper = el.pepper.value;
});

el.burnin.addEventListener("mousemove", function () {
  opts.burnin = el.burnin.value;
});

["mousemove", "click"].forEach((event) => {
  el.length.addEventListener(event, function () {
    console.log("el.length.value= ", el.length.value);
    let n = Math.min(Math.max(el.length.value, opts.minlength), opts.maxlength);
    el.length.value = opts.length = n;
  });
});

el.hide.addEventListener("click", function () {
  let els = ["saltRow", "pepperRow", "lengthRow", "burninRow", "passwordsRow"];
  for (let id of els) {
    // console.log("id= ", id);
    document.getElementById(id).classList.toggle("hidden");
  }
  let src = el.hide.src;
  el.hide.src = src.includes("crossed")
    ? src.replace("crossed", "open")
    : src.replace("open", "crossed");
  el.hint.type = el.hint.type === "password" ? "text" : "password";
});

el.generate.addEventListener("click", function () {
  console.log("generate:0: opts.burnin=", opts.burnin);
  window.localStorage.setItem("options", JSON.stringify(opts));
  el.salt.value = opts.salt;
  el.pepper.value = opts.pepper;
  el.length.value = opts.length;
  el.burnin.value = opts.burnin;
  // el.length.textContent = opts.length;
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
  // let passwd = getPass(args);
  let passwd = getPass(args);
  document.getElementById("passwords").prepend(passwd + "\n");
});
