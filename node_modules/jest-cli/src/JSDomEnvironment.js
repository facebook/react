/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var FakeTimers = require('./lib/FakeTimers');

function _deepCopy(obj) {
  var newObj = {};
  var value;
  for (var key in obj) {
    value = obj[key];
    if (typeof value === 'object' && value !== null) {
      value = _deepCopy(value);
    }
    newObj[key] = value;
  }
  return newObj;
}

function JSDomEnvironment(config) {
  // We lazily require jsdom because it takes a good ~.5s to load.
  //
  // Since this file may be require'd at the top of other files that may/may not
  // use it (depending on the context -- such as TestRunner.js when operating as
  // a workerpool parent), this is the best way to ensure we only spend time
  // require()ing this when necessary.
  this.global = require('./lib/jsdom-compat').jsdom().parentWindow;

  // Node's error-message stack size is limited at 10, but it's pretty useful to
  // see more than that when a test fails.
  this.global.Error.stackTraceLimit = 100;

  // Setup defaults for navigator.onLine
  // TODO: It's questionable as to whether this should go here
  //       It's a pretty rarely depended on feature, so maybe tests that care
  //       about it should just shim it themselves?)
  this.global.navigator.onLine = true;

  // Pass through the node implementation of some needed APIs
  this.global.ArrayBuffer = ArrayBuffer;
  this.global.Float32Array = Float32Array;
  this.global.Int16Array = Int16Array;
  this.global.Int32Array = Int32Array;
  this.global.Int8Array = Int8Array;
  this.global.Uint8Array = Uint8Array;
  this.global.Uint16Array = Uint16Array;
  this.global.Uint32Array = Uint32Array;
  this.global.DataView = DataView;
  this.global.Buffer = Buffer;
  this.global.process = process;

  if (typeof setImmediate === 'function') {
    this.global.setImmediate = setImmediate;
    this.global.clearImmediate = clearImmediate;
  }

  this.fakeTimers = new FakeTimers(this.global);

  // I kinda wish tests just did this manually rather than relying on a
  // helper function to do it, but I'm keeping it for backward compat reasons
  // while we get jest deployed internally. Then we can look into removing it.
  //
  // #3376754
  if (!this.global.hasOwnProperty('mockSetReadOnlyProperty')) {
    this.global.mockSetReadOnlyProperty = function(obj, property, value) {
      obj.__defineGetter__(property, function() {
        return value;
      });
    };
  }

  // jsdom doesn't have support for window.Image, so we just replace it with a
  // dummy constructor
  try {
    /* jshint nonew:false */
    new this.global.Image();
  } catch (e) {
    this.global.Image = function Image() {};
  }

  // Pass through the node `process` global.
  // TODO: Consider locking this down somehow so tests can't do crazy stuff to
  //       worker processes...
  this.global.process = process;

  // Apply any user-specified global vars
  var globalValues = _deepCopy(config.globals);
  for (var customGlobalKey in globalValues) {
    // Always deep-copy objects so isolated test environments can't share memory
    this.global[customGlobalKey] = globalValues[customGlobalKey];
  }
}

JSDomEnvironment.prototype.dispose = function() {
  // TODO: In node 0.8.8 (at least), closing each jsdom context appears to
  //       reproducibly cause a worker to segfault after a large number of tests
  //       have run (repro cases had > 1200).
  //
  //       Disabling this to solve the problem for now -- but we should come
  //       back and investigate this soon. There's a reasonable chance that not
  //       closing out our contexts is eating an absurd amount of memory...
  //this.global.close();
};

JSDomEnvironment.prototype.runSourceText = function(sourceText, fileName) {
  return this.global.run(sourceText, fileName);
};

JSDomEnvironment.prototype.runWithRealTimers = function(cb) {
  this.fakeTimers.runWithRealTimers(cb);
};

module.exports = JSDomEnvironment;
