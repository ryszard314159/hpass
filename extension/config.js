const default_opts = {
  salt: "salt",
  pepper: "@",
  length: 15,
  burnin: 9,
  email: "email",
  username: "username",
};
const maxlength = 64;
const minlength = 5;
const maxburnin = 9999;

const optsKeys = Object.keys(default_opts);
// ["pepper", "salt", "length", "burnin", "email", "username"];

/*
      from: https://www.30secondsofcode.org/js/s/copy-to-clipboard
      see also: https://github.com/w3c/clipboard-apis/blob/master/explainer.adoc#writing-to-the-clipboard
*/
function copyToClipboard(str) {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  el.focus();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}

// "www.mos.org" => "mos.org"
function getHint(domain) {
  return domain.split(".").slice(-2).join(".");
}

export {
  getHint,
  copyToClipboard,
  default_opts,
  optsKeys,
  minlength,
  maxlength,
  maxburnin,
};
