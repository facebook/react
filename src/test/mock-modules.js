/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mock-modules
 */

var mocks = require("mocks");
var exportsRegistry = {};
var hasOwn = exportsRegistry.hasOwnProperty;
var explicitMockMap = {};

function getMock(exports) {
  try {
    return mocks.generateFromMetadata(mocks.getMetadata(exports));
  } catch (err) {
    console.warn(err);
    return exports;
  }
}

// This function should be called at the bottom of any module that might
// need to be mocked, after the final value of module.exports is known.
exports.register = function(id, module) {
  exportsRegistry[id] = {
    module: module,
    actual: module.exports,
    mocked: null // Filled in lazily later.
  };

  // If doMock or doNotMock was called earlier, before the module was
  // registered, then the choice should have been recorded in
  // explicitMockMap. Now that the module is registered, we can finally
  // fulfill the request.
  if (hasOwn.call(explicitMockMap, id)) {
    if (explicitMockMap[id]) {
      doMock(id);
    } else {
      doNotMock(id);
    }
  }

  return exports;
};

function resetEntry(id) {
  if (hasOwn.call(exportsRegistry, id)) {
    delete exportsRegistry[id].module.exports;
    delete exportsRegistry[id];
  }
}

exports.dumpCache = function() {
  require("mocks").clear();

  // Deleting module.exports will cause the module to be lazily
  // reevaluated the next time it is required.
  for (var id in exportsRegistry) {
    resetEntry(id);
  }

  return exports;
};

exports.getMockMap = function() {
  return explicitMockMap;
};

exports.clearMockMap = function() {
  explicitMockMap = {};
};

exports.setMockMap = function(mockMap) {
  exports.dumpCache();
  exports.clearMockMap();
  for (var id in mockMap) {
    if (mockMap[id]) {
      doMock(id);
    } else {
      doNotMock(id);
    }
  }

  return exports;
};

// Call this function to ensure that require(id) returns the actual
// exports object created by the module.
function doNotMock(id) {
  explicitMockMap[id] = false;

  var entry = exportsRegistry[id];
  if (entry && entry.module && entry.actual) {
    entry.module.exports = entry.actual;
  }

  return exports;
}

// Call this function to ensure that require(id) returns a mock exports
// object based on the actual exports object created by the module.
function doMock(id) {
  explicitMockMap[id] = true;

  var entry = exportsRegistry[id];
  if (entry && entry.module && entry.actual) {
    // Because mocking can be expensive, create the mock exports object on
    // demand, the first time doMock is called.
    entry.mocked || (entry.mocked = getMock(entry.actual));
    entry.module.exports = entry.mocked;
  }

  return exports;
}

var global = Function("return this")();
require('test/mock-timers').installMockTimers(global);

// Exported names are different for backwards compatibility.
exports.dontMock = doNotMock;
exports.mock = doMock;
