/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeContainerInfo
 * @flow
 */
'use strict';

function ReactNativeContainerInfo(tag: number) {
  var info = {
    _tag: tag,
  };
  return info;
}

module.exports = ReactNativeContainerInfo;
