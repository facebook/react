/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTypeOfCompletion
 * @flow
 */

'use strict';

export type TypeOfCompletion = number;

module.exports = {
  Incomplete: 0,
  Complete: 1,
  Blocked: 1 << 1,
};
