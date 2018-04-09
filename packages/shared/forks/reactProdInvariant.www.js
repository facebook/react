/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const invariant = require('invariant');

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

  // www doesn't strip this because we mark the React bundle
  // with @preserve-invariant-messages docblock.
  const i = invariant;
  // However, we call it with a different name to avoid
  // transforming this file itself as part of React's own build.
  i(false, message);
}

export default reactProdInvariant;
