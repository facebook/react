/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'shared/invariant';

// Provided by www
const ReactFbErrorUtils = require('ReactFbErrorUtils');
invariant(
  typeof ReactFbErrorUtils.invokeGuardedCallback === 'function',
  'Expected ReactFbErrorUtils.invokeGuardedCallback to be a function.',
);

// This object will be mutated by the www version.
let result = {
  _hasCaughtError: false,
  _caughtError: null,
};

let invokeGuardedCallbackImpl = function<A, B, C, D, E, F, Context>(
  name: string | null,
  func: (a: A, b: B, c: C, d: D, e: E, f: F) => mixed,
  context: Context,
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
) {
  // The www version doesn't take the `onError` callback on context.
  // Instead, it writes the result to fields on context.
  // TODO: change the www function API so we can re-export it directly.
  ReactFbErrorUtils.invokeGuardedCallback.apply(result, arguments);
  if (result._hasCaughtError) {
    this.onError(result._caughtError);
  }
};

export default invokeGuardedCallbackImpl;
