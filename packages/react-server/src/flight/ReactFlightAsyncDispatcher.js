/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo} from 'shared/ReactTypes';

import type {AsyncDispatcher} from 'react-reconciler/src/ReactInternalTypes';

import {resolveRequest, getCache} from '../ReactFlightServer';

import {disableStringRefs} from 'shared/ReactFeatureFlags';

import {resolveOwner} from './ReactFlightCurrentOwner';

function resolveCache(): Map<Function, mixed> {
  const request = resolveRequest();
  if (request) {
    return getCache(request);
  }
  return new Map();
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getCacheForType<T>(resourceType: () => T): T {
    const cache = resolveCache();
    let entry: T | void = (cache.get(resourceType): any);
    if (entry === undefined) {
      entry = resourceType();
      // TODO: Warn if undefined?
      cache.set(resourceType, entry);
    }
    return entry;
  },
}: any);

if (__DEV__) {
  DefaultAsyncDispatcher.getOwner = resolveOwner;
} else if (!disableStringRefs) {
  // Server Components never use string refs but the JSX runtime looks for it.
  DefaultAsyncDispatcher.getOwner = (): null | ReactComponentInfo => {
    return null;
  };
}
