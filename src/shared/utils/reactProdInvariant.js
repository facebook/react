/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule reactProdInvariant
 */
'use strict';

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throw.
 */
function reactProdInvariant(code, a, b, c, d, e, f) {
  var argCount = arguments.length - 1;

  var format = (
    'React: production error #' + code + '. ' +
    'Visit http://facebook.github.io/react/docs/' +
    'error-codes.html?invariant=' + code
  );

  while (argCount > 0) {
    format += '&args=%22%s%22';
    argCount--;
  }

  format += ' for more details.';
  var error;

  var args = [a, b, c, d, e, f];
  var argIndex = 0;
  error = new Error(format.replace(/%s/g, function() {
    return args[argIndex++];
  }));
  error.name = 'Invariant Violation';

  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame
  throw error;
}

module.exports = reactProdInvariant;
