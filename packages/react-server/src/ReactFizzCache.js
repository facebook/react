/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from 'react-reconciler/src/ReactInternalTypes';

function getCacheSignal(): AbortSignal {
  throw new Error('Not implemented.');
}

function getCacheForType<T>(resourceType: () => T): T {
  throw new Error('Not implemented.');
}

export const DefaultCacheDispatcher: CacheDispatcher = {
  getCacheSignal,
  getCacheForType,
};
