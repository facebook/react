// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for the differential-fuzzing library files.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(
    path.join(__dirname, '..', 'resources', 'differential_fuzz_library.js'));
const code = fs.readFileSync(libPath, 'utf-8');

// We wire the print function to write to this result variable.
const resultDummy = 'let result; const print = text => { result = text; };';

// The prettyPrinted function from mjsunit is reused in the library.
const prettyPrint = 'let prettyPrinted = value => value;';

const hookedUpCode = resultDummy + prettyPrint + code;

// Runs the library, adds test code and verifies the result.
function testLibrary(testCode, expected) {
  // The code isn't structured as a module. The test code is expected to
  // evaluate to a result which we store in actual.
  const actual = eval(hookedUpCode + testCode);
  assert.deepEqual(expected, actual);
}

describe('Differential fuzzing library', () => {
  it('prints objects', () => {
    testLibrary(
        '__prettyPrint([0, 1, 2, 3]); result;',
        '[0, 1, 2, 3]');
    testLibrary(
        '__prettyPrint({0: 1, 2: 3}); result;',
        'Object{0: 1, 2: 3}');
    testLibrary(
        'const o = {}; o.k = 42;__prettyPrint(o); result;',
        'Object{k: 42}');
  });

  it('cuts off deep nesting', () => {
    // We print only until a nesting depth of 4.
    testLibrary(
        '__prettyPrint({0: [1, 2, [3, {4: []}]]}); result;',
        'Object{0: [1, 2, [3, Object{4: ...}]]}');
  });

  it('cuts off long strings', () => {
    const long = new Array(66).join('a');
    const head = new Array(55).join('a');
    const tail = new Array(10).join('a');
    testLibrary(
        `__prettyPrint("${long}"); result;`,
        `${head}[...]${tail}`);
    // If the string gets longer, the cut-off version is still the same.
    const veryLong = new Array(100).join('a');
    testLibrary(
        `__prettyPrint("${veryLong}"); result;`,
        `${head}[...]${tail}`);
  });

  it('tracks hash difference', () => {
    // Test that we track a hash value for each string we print.
    const long = new Array(66).join('a');
    testLibrary(
        `__prettyPrint("${long}"); __hash;`,
        2097980794);
    // Test that the hash value differs, also when the cut-off result doesn't.
    const veryLong = new Array(100).join('a');
    testLibrary(
        `__prettyPrint("${veryLong}"); __hash;`,
        -428472866);
    // Test that repeated calls update the hash.
    testLibrary(
        `__prettyPrint("${long}");__prettyPrint("${long}"); __hash;`,
        -909224493);
  });

  it('limits extra printing', () => {
    // Test that after exceeding the limit for calling extra printing, there
    // is no new string printed (in the test case no new result added).
    testLibrary(
        'for (let i = 0; i < 20; i++) __prettyPrintExtra(i); result;',
        '19');
    testLibrary(
        'for (let i = 0; i < 101; i++) __prettyPrintExtra(i); result;',
        '99');
    testLibrary(
        'for (let i = 0; i < 102; i++) __prettyPrintExtra(i); result;',
        '99');
  });

  it('tracks hash after limit', () => {
    // Test that after exceeding the limit for calling extra printing, the
    // hash is still updated.
    testLibrary(
        'for (let i = 0; i < 20; i++) __prettyPrintExtra(i); __hash;',
        -945753644);
    testLibrary(
        'for (let i = 0; i < 101; i++) __prettyPrintExtra(i); __hash;',
        1907055979);
    testLibrary(
        'for (let i = 0; i < 102; i++) __prettyPrintExtra(i); __hash;',
        -590842070);
  });
});
