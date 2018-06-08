/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

// We capture a local reference to any global, in case it gets polyfilled after
// this module is initially evaluated.
// We want to be using a consistent implementation.
const localRequestAnimationFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : undefined;

// The callsites should check if the requestAnimationFrame imported from this module is a function,
// fire a developer warning if it doesn't exist, and substitute it by a shim in that case
// (e.g. that throws on call).

export default localRequestAnimationFrame;
