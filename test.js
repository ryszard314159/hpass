"use strict";
import { getPass, MAXLENGTH, MINLENGTH } from "./core/lib.js";

const lst = [
    {hint: "zzz", unicode: true, length: 8, expected: "򔈌��w�7�_񈼝I"},
    {hint: "", pepper: "_", salt: "Salt", burn: 0, peak: "", expected: "???"}, // random result
    {hint: "hint", pepper: "_", salt: "Salt", burn: 0, peak: "", expected: "hR5EnBzSxsF_s1k"},
    {hint: "zzz",  pepper: "_", salt: "Salt", burn: 0, peak: "", expected: "x29wQToH08_5s7k"},
    {hint: "netflix",  pepper: "_", salt: "Replace Me!", burn: 0, peak: "", expected: "mTcR1G5U9_qjl6a"},
    {hint: "netflix",  pepper: "_", salt: "Replace Me!", burn: 5, peak: "", expected: "qRT2zj8zi5GDqF_"},
    {hint: "netflix",  pepper: "_", salt: "Replace Me!", burn: 7, peak: "Q", expected: "4_zMHwEg7IbXo86"}
]

// const lst = [{debug: true, unicode: true, length: 4, expected: "???"}];

let errCount = 0;
for (const args of lst) {
  let passwd = getPass(args);
  errCount += (passwd === args.expected) ? 0 : 1
//   console.log(`args.expected, passwd= ${args.expected}, ${passwd}, passwd.length= ${passwd.length}`);
}
let status = (errCount !== 2) ? "FAILED" : "PASSED";
// console.log(`errCount= ${errCount}`);
console.log(`tests ${status}!`);
// console.assert(errCount !== 2, "FAILED!")
