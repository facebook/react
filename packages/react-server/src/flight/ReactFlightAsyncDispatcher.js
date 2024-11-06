/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo} from 'shared/ReactTypes';

import type {
  AsyncCache,
  AsyncDispatcher,
} from 'react-reconciler/src/ReactInternalTypes';

import {resolveRequest, getCache} from '../ReactFlightServer';

import {disableStringRefs} from 'shared/ReactFeatureFlags';

import {resolveOwner} from './ReactFlightCurrentOwner';

function getActiveCache(): AsyncCache | null {
  const request = resolveRequest();
  if (request) {
    return getCache(request);
  }
  return null;
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getActiveCache,
}: any);

if (__DEV__) {
  DefaultAsyncDispatcher.getOwner = resolveOwner;
} else if (!disableStringRefs) {
  // Server Components never use string refs but the JSX runtime looks for it.
  DefaultAsyncDispatcher.getOwner = (): null | ReactComponentInfo => {
    return null;
  };
}
