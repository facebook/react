/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildren
 */

'use strict';

const {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED} = require('React');

// TODO: can't reexport public API because of
// mapIntoWithKeyPrefixInternal() dependency in an addon.
module.exports =
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactChildren;
