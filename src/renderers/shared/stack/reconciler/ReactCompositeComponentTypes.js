/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
