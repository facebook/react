/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeCSTypes
 * @flow
 */
'use strict';

/**
 * Flat CS renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeCSType = {
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,
  unstable_batchedUpdates: any, // TODO (bvaughn) Add types
};
