/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {MutableSource, MutableSourceGetVersionFn} from 'shared/ReactTypes';

export function createMutableSource<Source: $NonMaybeType<mixed>>(
  source: Source,
  getVersion: MutableSourceGetVersionFn,
): MutableSource<Source> {
  const mutableSource: MutableSource<Source> = {
    _getVersion: getVersion,
    _source: source,
    _workInProgressVersionPrimary: null,
    _workInProgressVersionSecondary: null,
  };

  if (__DEV__) {
    mutableSource._currentPrimaryRenderer = null;
    mutableSource._currentSecondaryRenderer = null;
  }

  return mutableSource;
}
