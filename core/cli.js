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

import { ArgumentParser, ArgumentDefaultsHelpFormatter } from "argparse";
import CLIP from "node-clipboardy";
// const ArgumentParser = require('argparse').ArgumentParser;
// const {
//   ArgumentParser,
//   ArgumentDefaultsHelpFormatter,
// } = require("argparse/argparse.js");
// const assert = require("assert");
// const lib = require("./lib.js");
import { getPass } from "./lib.js"; // SyntaxError: Cannot use import statement outside a module

const DESCRIPTION =
  "Seeded password generator - generates password from hint and salt; \
it is augmented by one special character (pepper), one lower and upper char and a digit. \
NOTE: defaults for salt, pepper and length can be overwritten by environment variables";

function get_parser() {
  // import {ArgumentParser,  ArgumentDefaultsHelpFormatter} from "argparse";
  const parser = ArgumentParser({
    description: DESCRIPTION,
    formatter_class: ArgumentDefaultsHelpFormatter,
  });
  // parser.addArgument('-v', '--version', { action: 'version', version });
  // parser.addArgument("hint", {
  parser.addArgument("hint", {
    help: "password hint; '' generates random passwd",
  });
  parser.addArgument(["-p", "--pepper"], {
    help: "punctuation pepper to use",
    default:
      typeof process.env.PEPPER === "undefined" ? "!" : process.env.PEPPER,
  });
  parser.addArgument(["-s", "--salt"], {
    help: "hint augmentation",
    default:
      typeof process.env.SALT === "undefined" ? "SALT" : process.env.SALT,
  });
  parser.addArgument(["-b", "--burn"], {
    help: "discard cycles",
    type: "int",
    default: 0,
  });
  parser.addArgument(["-L", "--length"], {
    help: "password length",
    type: "int",
    default:
      typeof process.env.LENGTH === "undefined" ? 15 : process.env.LENGTH,
  });
  parser.addArgument(["-u", "--unicode"], {
    help: "use ALL unicode chars",
    action: "storeTrue",
  });
  parser.addArgument(["-r", "--letters"], {
    help: "use ascii letters",
    action: "storeTrue",
  });
  parser.addArgument(["-t", "--digits"], {
    help: "use digits",
    action: "storeTrue",
  });
  parser.addArgument(["-n", "--punctuation"], {
    help: "use punctuation",
    action: "storeTrue",
  });
  parser.addArgument(["-f", "--no-shuffle"], {
    help: "dont shuffle final string",
    action: "storeTrue",
  });
  parser.addArgument(["-a", "--random"], {
    help: "create random password",
    action: "storeTrue",
  });
  parser.addArgument(["-d", "--debug"], {
    help: "debug on",
    action: "storeTrue",
  });
  parser.addArgument(["-v", "--verbose"], {
    help: "verbose output",
    action: "storeTrue",
  });

  // let args =  parser.parseArgs()
  // if (args.debug) console.dir(args);
  return parser;
}

let parser = get_parser();
let args, passwd;
if (
  typeof process.env.BUILTIN !== "undefined" ||
  typeof window !== "undefined"
) {
  // get args from window s
  console.log(`DEBUG: env.BUILTIN= ${process.env.BUILTIN}`);
  args = parser.parseArgs([$("#hint").val(), "-v"]);
} else {
  // get args from command line
  args = parser.parseArgs();
}

const defaults = {
  hint: "hint",
  pepper: typeof process.env.PEPPER === "undefined" ? "!" : process.env.PEPPER,
  salt: typeof process.env.SALT === "undefined" ? "SALT" : process.env.SALT,
  burn: typeof process.env.BURN === "undefined" ? 0 : process.env.BURN,
  length: typeof process.env.LENGTH === "undefined" ? 15 : process.env.LENGTH,
  unicode: false,
  letters: false,
  digits: false,
  punctuation: false,
  "no-shuffle": false,
  random: false,
  debug: false,
  verbose: false,
};

Object.keys(defaults).forEach((key) => {
  if (args[key] === null || args[key] === undefined) {
    args[key] = defaults[key];
  }
});

if (args.debug) {
  console.log("cli.js: DEBUG: args=", args);
}

// passwd = lib.getPass(args);
passwd = getPass(args);
CLIP.writeSync(passwd);
