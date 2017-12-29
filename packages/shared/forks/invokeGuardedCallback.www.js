/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'fbjs/lib/invariant';

const invokeGuardedCallback = require('ReactFbErrorUtils')
  .invokeGuardedCallback;
invariant(
  typeof invokeGuardedCallback === 'function',
  'Expected ReactFbErrorUtils.invokeGuardedCallback to be a function.',
);

export default invokeGuardedCallback;
