/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Relying on the `invariant()` implementation lets us
// have preserve the format and params in the www builds.
import invariant from 'fbjs/lib/invariant';

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */
function reactProdInvariant(code: string): void {
  const argCount = arguments.length - 1;
  let url = 'https://reactjs.org/docs/error-decoder.html?invariant=' + code;
  for (let argIdx = 0; argIdx < argCount; argIdx++) {
    url += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }
  // Rename it so that our build transform doesn't atttempt
  // to replace this invariant() call with reactProdInvariant().
  const i = invariant;
  i(
    false,
    // The error code is intentionally part of the message (and
    // not the format argument) so that we could deduplicate
    // different errors in logs based on the code.
    'Minified React error #' +
      code +
      '; visit %s ' +
      'for the full message or use the non-minified dev environment ' +
      'for full errors and additional helpful warnings. ',
    url,
  );
}

export default reactProdInvariant;
