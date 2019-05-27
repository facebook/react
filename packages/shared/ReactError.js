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

function ReactError(message) {
  const error = new Error(message);
  error.name = 'Invariant Violation';
  return error;
}

export default ReactError;
