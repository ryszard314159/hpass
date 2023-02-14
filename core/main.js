#!/usr/bin/env node

/* HPASS - reproducible password generator.
 * Copyright (C) 2023 Ryszard Czerminski
 *
 * This file is part of HPASS.
 * HPASS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * HPASS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// import { ArgumentParser,  ArgumentDefaultsHelpFormatter} from "argparse";
// const ArgumentParser = require('argparse').ArgumentParser;
const { ArgumentParser,  ArgumentDefaultsHelpFormatter} = require('argparse/argparse.js');
const assert = require('assert');
const lib = require("./lib.js")
// import { getPass } from "./lib.js" // SyntaxError: Cannot use import statement outside a module

const DESCRIPTION = 'Seeded password generator - generates password from hint and salt; \
it is augmented by one special character (pepper), one lower and upper char and a digit. \
NOTE: defaults for salt, pepper and plength can be overwritten by environment variables'

function get_parser() {
  // import {ArgumentParser,  ArgumentDefaultsHelpFormatter} from "argparse";
  const parser = ArgumentParser({
    description: DESCRIPTION,
    formatter_class: ArgumentDefaultsHelpFormatter
  });
  // parser.add_argument('-v', '--version', { action: 'version', version });
  parser.add_argument('hint', {help: "password hint; '' generates random passwd"});
  parser.add_argument('-p', '--pepper', { help: 'punctuation pepper to use',
         default: typeof process.env.PEPPER === 'undefined' ? '!' : process.env.PEPPER });
  parser.add_argument('-s', '--salt', { help: 'hint augmentation',
         default: typeof process.env.SALT === 'undefined' ? 'SALT' : process.env.SALT });
  parser.add_argument('-b', '--burnin', { help: 'discard cycles', type: 'int', default: 0});
  parser.add_argument('-L', '--plength', { help: 'password length', type: 'int',
         default: typeof process.env.PLENGTH === 'undefined' ? 15 : process.env.PLENGTH });
  parser.add_argument('-u', '--unicode', { help: 'use ALL unicode chars', action: "store_true"});
  parser.add_argument('-r', '--letters', { help: 'use ascii letters', action: "store_true"});
  parser.add_argument('-t', '--digits', { help: 'use digits', action: "store_true"});
  parser.add_argument('-n', '--punctuation', { help: 'use punctuation', action: "store_true"});
  parser.add_argument('-f', '--no-shuffle', { help: 'dont shuffle final string', action: "store_true"});
  parser.add_argument('-a', '--random', { help: 'create random password', action: "store_true"});
  parser.add_argument('-d', '--debug', { help: 'debug on', action: "store_true"});
  parser.add_argument('-v', '--verbose', { help: 'verbose output', action: "store_true"});
  // let args =  parser.parse_args()
  // if (args.debug) console.dir(args);
  return parser
}

let parser = get_parser();
// let args, passwd;
if (typeof process.env.BUILTIN !== 'undefined' || typeof window !== 'undefined') {
  // get args from window s
  print(`DEBUG: env.BUILTIN= ${process.env.BUILTIN}`)
  args = parser.parse_args([$('#hint').val(), '-v'])
} else {
  // get args from command line
  args = parser.parse_args()
}
if (args.debug) console.dir(args);

passwd = lib.getPass(args);
// passwd = getPass(args);