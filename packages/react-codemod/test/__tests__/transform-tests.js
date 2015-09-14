/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

  it('transforms the "pure-render-mixin" tests correctly', () => {
    test('pure-render-mixin', 'pure-render-mixin-test');

    test('pure-render-mixin', 'pure-render-mixin-test2');

    test('pure-render-mixin', 'pure-render-mixin-test3');

    test('pure-render-mixin', 'pure-render-mixin-test4', {
      'mixin-name': 'ReactComponentWithPureRenderMixin',
    });
  });

  it('transforms the "class" tests correctly', () => {
    test('class', 'class-test');

    test('class', 'class-test2', {
      'super-class': false
    });

    test('class', 'class-test3');

  });

  it('transforms exports class', () => {
    test('class', 'export-default-class-test');
  });

});
