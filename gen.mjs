#!/usr/bin/env node
'use strict';
import clipboardy from "clipboardy";
const MP31 = 2**31 - 1 // Mersenne prime
// import assert from 'assert';
// const assert = require('assert');
import assert from "assert";
import {ArgumentParser,  ArgumentDefaultsHelpFormatter} from "argparse";
const print = console.log

function get_parser() {
  // const { ArgumentParser,  ArgumentDefaultsHelpFormatter} = require('argparse');
  const parser = new ArgumentParser({
    description: 'Seeded password generator - generates password from hint and sekret \
    ; it is augmented by one special character (prefix), one lower and upper char and a digit',
    formatter_class: ArgumentDefaultsHelpFormatter
  });
  // parser.add_argument('-v', '--version', { action: 'version', version });
  parser.add_argument('hint', {help: "password hint; '' generates random passwd"});
  parser.add_argument('-x', '--prefix', { help: 'password prefix', default: '<PREFIX>' });
  parser.add_argument('-k', '--sekret', { help: 'hint augmentation', default: '<SEKRET>' });
  parser.add_argument('-b', '--burnin', { help: 'discard cycles', type: 'int', default: 0});
  parser.add_argument('-L', '--length', { help: 'password length', type: 'int', default: '<LENGTH>'});
  parser.add_argument('-u', '--unicode', { help: 'use ALL unicode chars', action: "store_true"});
  parser.add_argument('-r', '--letters', { help: 'use ascii letters', action: "store_true"});
  parser.add_argument('-t', '--digits', { help: 'use digits', action: "store_true"});
  parser.add_argument('-p', '--punctuation', { help: 'use punctuation', action: "store_true"});
  parser.add_argument('-f', '--no-shuffle', { help: 'dont shuffle final string', action: "store_true"});
  parser.add_argument('-a', '--random', { help: 'create random password', action: "store_true"});
  parser.add_argument('-d', '--debug', { help: 'baz bar', action: "store_true"});
  parser.add_argument('-v', '--verbose', { help: 'add output', action: "store_true"});
  // let args =  parser.parse_args()
  // if (args.debug) console.dir(args);
  return parser
}

/* permute chars in string using Durstenfeld shuffle algorithm */
function shuffle_string(string, gint=rig(MP31, seed)) {
  let z = string.split(''), i, j;
  for (i = z.length - 1; i > 0; i--) {
      j = gint.next().value % i;
      [z[i], z[j]] = [z[j], z[i]]
  }
  return z.join('')
}

function hash_string(s) {
  assert(typeof(s) === 'string', `string expected, got ${s}`)
  const p = 2**5 - 1, m = MP31 // 2**31 - 1; // Mersenne primes: 2^(2, 3, 5, 7, 13, 17, 19, 31, 67, 127, 257)
  var value = MP31 // 2**31 - 1;
  var pp = 1;
  for (var j=0; j < s.length; j++) {
      value = (value + s.charCodeAt(j) * pp) % m;
      pp = (pp * p) % m;
  }
  return value;
}

/*
create small array of random integers
Donald Knuth MMIX: m = 2**64; a=6364136223846793005; c = 1442695040888963407
*/
// random integer generator
// generates integers in [0, max) interval
function* rig(max, hint) {
  let m = MP31, a=2147483629, c=2147483587;
  assert(typeof(max) === 'number' && (0 < max) && (max <= m),
    `rig: max (=${max}) must be number and has to be smaller than 2**31 - 1`)
  assert(typeof(hint) === 'string', `hint must be string, got ${typeof(hint)}`)
  var seed = hint == '' ? Date.now() : hash_string(hint)
  while (true) {
    seed = (a * seed + c) % m;
    yield Math.abs(seed % max)
  }
}

function get_random_string(n, charset='', gint=rig(MP31, '')) { // seed=undefined) {
  /*
  n       : length of string to generate
  charset : alphabet to use; NOTE: all unicode chars will be used if charset == ''
  gint    : random integer generator
  */
  const MAX_CODE_POINT = 1114111 + 1;
  assert(0 < n && n < 65 , `n must be in (0,65) range, got ${n}`)
  assert(charset.length < MAX_CODE_POINT, `too long charset, ${charset.length}`)
  /*
  see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
  */
  let z = '';
  for (let i=0; i < n; i++) {
    let k = gint.next().value
    z += (charset !== '') ? charset[k % charset.length] : String.fromCodePoint(k % MAX_CODE_POINT)
  }
  return z
}

function copy_to_clipboard(x) {
    if (typeof window === "undefined") {
      const CLIP = clipboardy
      // import clipboardy from "clipboardy"
      CLIP.writeSync(x)
    } else {
      /*
      from: https://www.30secondsofcode.org/js/s/copy-to-clipboard
      see also: https://github.com/w3c/clipboard-apis/blob/master/explainer.adoc#writing-to-the-clipboard
      */
      const copyToClipboard = str => {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        const selected =
          document.getSelection().rangeCount > 0
            ? document.getSelection().getRangeAt(0)
            : false;
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if (selected) {
          document.getSelection().removeAllRanges();
          document.getSelection().addRange(selected);
        }
      };
      copyToClipboard(x);
    }
}

function getPass(args) {
  /*
  args.prefix      : prefix for generated password
  args.hint        : hint to generate password
  args.burn        : number of 'burn' steps in rng
  args.length      : length of password
  args.digits      : should digits be used?
  args.letters     : should letters be used?
  args.punctuation : should punctuation be used?
  */

  const CHARS = {}
  CHARS.digits = '0123456789'
  CHARS.lower = 'abcdefghijklmnopqrstuvwxyz'
  CHARS.upper = CHARS.lower.toUpperCase()
  CHARS.punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

  var charset = ''
  if (!args.unicode) {
    if (args.digits) charset += CHARS.digits
    if (args.letters) charset += CHARS.lower + CHARS.upper
    if (args.punctuation) charset += CHARS.punctuation
    if (charset.length == 0) charset = CHARS.digits + CHARS.lower + CHARS.upper
  }

  // let passwd;
  if (args.hint === '') { // generate and return random string from charset
      passwd = get_random_string(args.length, charset)
  } else {

      /*
      add to prefix one lower, one upper character and one digit
      to satisfy requirements of many sites
      one or more special characters can be provided in args.prefix (default='?')
      */
      let hint = args.hint + args.sekret + args.prefix + args.length
      let gint = rig(MP31, hint)
      for (let k=0; k < args.burnin; k++) { gint.next().value }
      let lower = get_random_string(1, CHARS.lower,  gint)
      let upper = get_random_string(1, CHARS.upper,  gint)
      let digit = get_random_string(1, CHARS.digits, gint)
      // const prefix = args.prefix + lower + upper + digit
      let n = args.length - args.prefix.length
      if (args.debug) {
        print(`DEBUG: args.hint= ${args.hint}`)
        print(`DEBUG: args.sekret= ${args.sekret}`)
        print(`DEBUG: args.prefix= ${args.prefix}`)
        print(`DEBUG: args.length= ${args.length}`)
        print(`DEBUG: args.burnin= ${args.burnin}`)
        print(`DEBUG: n= ${n}`)
        print(`DEBUG: hint= ${hint}`)
      }
      assert(n >= 0, `prefix too long: args.length= ${args.length} - args.prefix.length= ${args.prefix.length}`)
      passwd = get_random_string(args.length - args.prefix.length, charset, gint)
      passwd = args.prefix + passwd // augment password with prefix e.g. '?aZ9'
      if (!args.no_shuffle) {
        passwd = shuffle_string(passwd, gint)
      }
  }
  copy_to_clipboard(passwd)
  if (args.verbose) {
    print(`password >>> ${passwd} <<< (copied to clipboard)`)
  }
  return passwd
}

let parser = get_parser();
let args, passwd;
if (typeof process.env.BUILTIN !== 'undefined' || typeof window !== 'undefined') {
  // get args from window s
  print(`DEBUG: env.BUILTIN= ${process.env.BUILTIN}`)
  args = parser.parse_args([$('#hint').val(), '-v'])
} else {
  // get args from command line
  args = parser.parse_args()
}
if (args.debug) console.dir(args);

passwd = getPass(args)

// <script type="text/javascript" src="pass.js"></script>

/*
let MAX_CODE_POINT = 1114111
let v = new Set()
for (let j=0; j<MAX_CODE_POINT; j++) v.add(String.fromCodePoint(j))

Nick Feltwell <nfeltwell@barringtonjames.com>

  if (args.debug) {
    print("DEBUG: getPass: passwd=" + passwd)
    print("DEBUG: getPass: passwd.length=" + passwd.length)
    print("DEBUG: args.length=" + args.length)
    print("DEBUG: args.prefix=" + args.prefix)
    print("DEBUG: prefix=" + prefix + ' (augmented)')
    print("DEBUG: prefix.length=" + prefix.length)
    print("DEBUG: lower=" + lower)
    print("DEBUG: upper=" + upper)
    print("DEBUG: digit=" + digit)
    print("DEBUG: args.sekret=" + args.sekret)
    print("DEBUG: hint=" + hint)
    print("DEBUG: charset=" + charset)
  }

*/
