/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mergeInto
 * @typechecks static-only
 */

"use strict";

var assign = require('Object.assign');

module.exports = assign;

// deprecation notice
console.warn(
  'react/lib/mergeInto has been deprecated and will be removed in the ' +
  'next version of React. All uses can be replaced with ' +
  'Object.assign(a, b, c, ...) or _.extend(a, b, c, ...).'
);
