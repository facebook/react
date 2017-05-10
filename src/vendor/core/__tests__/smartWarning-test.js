/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var ChildUpdates;
var MorphingComponent;
var React;
var ReactCurrentOwner;
var ReactDoNotBindDeprecated;
var ReactMount;
var ReactPropTypes;
var ReactServerRendering;
var ReactTestUtils;

var cx;
var reactComponentExpect;
var smartWarning;
var mocks;

describe('ReactCompositeComponent', function() {

  beforeEach(function() {
    cx = require('cx');
    mocks = require('mocks');
    smartWarning = require('smartWarning');

    console.warn = mocks.getMockFunction();
    spyOn(console, 'warn');
  });

  it('should not warn duplicate warnings', function() {
    smartWarning(false, "Hello %s!  Life is good!", "Jim");
    smartWarning(false, "Hello %s!  Life is good!", "Jim");
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim!  Life is good!'
    );
  });

  it('should render unique warnings', function() {
    smartWarning(false, "Hello %s, how are you today?", "Jim");
    smartWarning(false, "Hello %s, how are you today?", "Josh");
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: Hello Josh, how are you today?'
    );
  });

  it('should honor distinct cache keys (trivial)', function() {
    smartWarning(false, "Hello %s, how are you today?", "Jim", "Key1");
    smartWarning(false, "Hello %s, how are you today?", "Jim", "Key2");
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
  });

  it('should honor duplicate cache keys (trivial)', function() {
    smartWarning(false, "Hello %s, how are you today?", "Jim", "Key");
    smartWarning(false, "Hello %s, how are you today?", "Josh", "Key");
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
  });

  it('should honor distinct cache keys (complex)', function() {
    var key1 = function(){return 1;};
    var key2 = function(){return 2;};
    smartWarning(false, "Hello %s, how are you today?", "Jim", key1);
    smartWarning(false, "Hello %s, how are you today?", "Jim", key2);
    expect(console.warn.argsForCall.length).toBe(2);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
    expect(console.warn.argsForCall[1][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
  });

  it('should honor duplicate cache keys (complex)', function() {
    var key = function(){};
    smartWarning(false, "Hello %s, how are you today?", "Jim", key);
    smartWarning(false, "Hello %s, how are you today?", "Josh", key);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: Hello Jim, how are you today?'
    );
  });
});
