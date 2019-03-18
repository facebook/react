/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Do not require this module directly! Use a normal error constructor with
// template literal strings. The messages will be converted to ReactError during
// build, and in production they will be minified.

function ReactErrorProd(code) {
  let url = 'https://reactjs.org/docs/error-decoder.html?invariant=' + code;
  for (let i = 1; i < arguments.length; i++) {
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }
  return new Error(
    `Minified React error #${code}; visit ${url} for the full message or ` +
      'use the non-minified dev environment for full errors and additional ' +
      'helpful warnings. ',
  );
}

export default ReactErrorProd;
