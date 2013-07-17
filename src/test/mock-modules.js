/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
