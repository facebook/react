/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTypeOfInternalContext
 * @flow
 */

'use strict';

export type TypeOfInternalContext = number;

module.exports = {
  NoContext: 0,
  AsyncUpdates: 1,
};
