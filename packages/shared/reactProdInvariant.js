/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */
function reactProdInvariant(code: string): void {
  const argCount = arguments.length - 1;

  let message =
    'Minified React error #' +
    code +
    '; visit ' +
    'http://reactjs.org/docs/error-decoder.html?invariant=' +
    code;

  for (let argIdx = 0; argIdx < argCount; argIdx++) {
    message += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }

  message +=
    ' for the full message or use the non-minified dev environment' +
    ' for full errors and additional helpful warnings.';

  const error: Error & {framesToPop?: number} = new Error(message);
  error.name = 'Invariant Violation';
  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame

  throw error;
}

export default reactProdInvariant;
