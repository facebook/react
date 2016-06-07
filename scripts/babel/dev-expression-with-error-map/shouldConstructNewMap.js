/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

/*:: import type { ErrorMap } from './Types' */

function shouldConstructNewMap(
  currentErrorMap/* : ErrorMap */,
  currentReactVersion/* : string */
)/* : boolean */ {
  if (currentErrorMap) {
    return currentReactVersion !== currentErrorMap.version;
  }

  return true;
}

module.exports = shouldConstructNewMap;
