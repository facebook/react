/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable quotes */
'use strict';

const babel = require('babel-core');
// const transformReactJSX = require('../transform-react-jsx');
const fs = require('fs');
const path = require('path');

function transform(input, isDev) {
  return babel.transform(input, {
    plugins: [
      [
        './scripts/babel/transform-react-to-jsx',
        {
          module: 'bluebird',
          method: 'coroutine',
        },
      ],
    ],
  }).code;
}

function compare(input, output) {
  const compiled = transform(input);
  expect(compiled).toEqual(output);
}

const TEST_DIR = './scripts/babel/__tests__/fixtures';
function makeTests() {
  fs.readdirSync(TEST_DIR).forEach(filename => {
    const testLoc = path.join(TEST_DIR, filename);
    const inputLoc = path.join(testLoc, 'input.js');
    const outputLoc = path.join(testLoc, 'output.js');
    const input = fs.readFileSync(inputLoc, 'utf8');
    const output = fs.readFileSync(outputLoc, 'utf8');
    it(filename, () => {
      compare(input, output);
    });
  });
}

describe('transform react to jsx', () => {
  makeTests();
});
