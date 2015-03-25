/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

var fs = require('fs');
var jscodeshift = require('jscodeshift');

function read(fileName) {
  return fs.readFileSync(__dirname + '/../' + fileName, 'utf8');
}

function test(transformName, testFileName, options) {
  var path = testFileName + '.js';
  var source = read(testFileName + '.js');
  var output = read(testFileName + '.output.js');

  var transform = require('../../transforms/' + transformName);
  expect(
    (transform({path, source}, {jscodeshift}, options || {}) || '').trim()
  ).toEqual(
    output.trim()
  );
}

describe('Transform Tests', () => {

  it('transforms the "findDOMNode" tests correctly', () => {
    test('findDOMNode', 'findDOMNode-test');
  });


});
