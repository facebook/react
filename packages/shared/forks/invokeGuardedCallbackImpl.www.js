/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

const invokeGuardedCallbackImpl = function<A, B, C, D, E, F, Context>(
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
  // This will call `this.onError(err)` if an error was caught.
  ReactFbErrorUtils.invokeGuardedCallback.apply(this, arguments);
};

export default invokeGuardedCallbackImpl;
