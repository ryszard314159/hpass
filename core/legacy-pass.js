#!/usr/bin/env node
'use strict';

const CHARS = {}
CHARS.digits = '0123456789'
CHARS.lower = 'abcdefghijklmnopqrstuvwxyz'
CHARS.upper = CHARS.lower.toUpperCase()
CHARS.punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

function lowest_code(s) {
  var xmin = 1e9
  for (var j=0; j < s.length; j++) {
    // console.log('j, s[j], s.charCodeAt[j]=', j, s[j], s.charCodeAt(j))
    xmin = Math.min(s.charCodeAt(j), xmin)
  }
  return xmin
}

function print(msg) {
  if (typeof window !== 'undefined') {
    document.write(msg + "<br>")
  } else {
    console.log(msg) }
}

function parse_cmd_line() {
  const { ArgumentParser,  ArgumentDefaultsHelpFormatter} = require('argparse');
  // const { version } = require('./package.json');

  const parser = new ArgumentParser({
    description: 'Seeded password generator',
    formatter_class: ArgumentDefaultsHelpFormatter
  });

  // parser.add_argument('-v', '--version', { action: 'version', version });
  parser.add_argument('seed', { help: 'required password seed' });
  parser.add_argument('-k', '--sekret', { help: 'seed augmentation', default: '' });
  parser.add_argument('-L', '--len', { help: 'password length', type: 'int', default: 32});
  parser.add_argument('-u', '--unicode', { help: 'use ALL unicode chars', action: "store_true"});
  parser.add_argument('-r', '--letters', { help: 'use ascii letters', action: "store_true"});
  parser.add_argument('-t', '--digits', { help: 'use digits', action: "store_true"});
  parser.add_argument('-p', '--punctuation', { help: 'use punctuation', action: "store_true"});
  parser.add_argument('-e', '--prefix', { help: 'password prefix', default: 'aZ9.' });
  parser.add_argument('-d', '--debug', { help: 'baz bar', action: "store_true"});
  parser.add_argument('-v', '--verbose', { help: 'add output', action: "store_true"});

  let args =  parser.parse_args()
  if (args.debug) console.dir(args);
  return args
}

function hash_string(s) {
  const p = 2**5 - 1, m = 2**31 - 1; // Mersenne primes
  var value = 0, pp = 1;
  // xmin = lowest_code(s) // lowest code for chars in string
  // xmin = 1
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
function* rig(max, seed) {
  var assert = require('assert');
  let m=2**31-1, a=2147483629, c=2147483587;
  if (typeof max === 'number') {
     assert((0 < max) && (max < m),
           'rig: max (=' + max + ') has to be smaller than 2**31 - 1')
  }
  if (typeof seed === 'undefined' || seed == '') {
    seed = Date.now();
  } else {
    seed = hash_string(seed)
  }
  while (true) {
    seed = (a * seed + c) % m;
    yield (typeof max === 'undefined') ? seed : Math.abs(seed % max)
  }
}

function get_random_string(n, charset='', seed=undefined) {
  /*
  n       : length of string to generate
  charset : alphabet to use; NOTE: all unicode chars will be used if charset == ''
  seed    : seed string for reproducible output
  */
  var assert = require('assert')
  const MAX_CODE_POINT = 1114111 + 1;
  assert(n > 0, 'n must be greater than 0')
  assert(charset.length < MAX_CODE_POINT, "too long charset")
  let max = (charset !== '')? charset.length : undefined
  /*
  see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
  */
  const g = rig(max, seed);
  let z = '';
  for (let i=0; i < n; i++) {
    let k = g.next().value % MAX_CODE_POINT
    z += (charset !== '')? charset[k] : String.fromCodePoint(k)
  }
  return z
}

function getPass(args) {
  /*
  args.prefix      : prefix for generated password
  args.seed        : seed to generate password
  args.burn        : number of 'burn' steps in rng
  args.len         : length of password
  args.digits      : should digits be used?
  args.letters     : should letters be used?
  args.punctuation : should punctuation be used?
  */

  var charset = ''
  if (!args.unicode) {
    if (args.digits) charset += CHARS.digits
    if (args.letters) charset += CHARS.lower + CHARS.upper
    if (args.punctuation) charset += CHARS.punctuation
    if (charset.length == 0) charset = CHARS.digits + CHARS.lower + CHARS.upper
  }

  if (args.debug) {
    print("\nDEBUG: getPass: args.seed=" + args.seed)
    print("\nDEBUG: getPass: args.prefix=" + args.prefix)
    print("\nDEBUG: getPass: args.len=" + args.len)
    print("\nDEBUG: getPass: charset=" + charset)
  }

  let seed = args.seed + args.sekret
  let passwd = get_random_string(args.len - args.prefix.length, charset, seed)
  passwd = args.prefix + passwd

  if (args.debug) {
    print("DEBUG: getPass: passwd=" + passwd)
    print("DEBUG: getPass: passwd.length=" + passwd.length)
  }
  if (typeof window === "undefined") {
    const CLIP = require('node-clipboardy');
    CLIP.writeSync(passwd)
  }
  return passwd
}

if (typeof window === 'undefined') {
  var args = parse_cmd_line();
}
let passwd = getPass(args)
if (args.verbose) {
    print("password >>> " + passwd + " <<< (copied to clipboard)")
}
// <script type="text/javascript" src="pass.js"></script>

/*
let MAX_CODE_POINT = 1114111
let v = new Set()
for (let j=0; j<MAX_CODE_POINT; j++) v.add(String.fromCodePoint(j))
*/
