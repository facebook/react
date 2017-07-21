/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCompositeComponentTypes
 * @flow
 */

export type CompositeComponentTypes = 0 | 1 | 2;

module.exports = {
  ImpureClass: 0,
  PureClass: 1,
  StatelessFunctional: 2,
};
