/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function isReactClass(type: any): boolean | undefined {
  try {
    return !!(type.prototype && type.prototype.isReactComponent);
  } catch (error) {
    console.error('Error in isReactClass:', error);
  }
}

export default isReactClass;
