/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AsyncDispatcher} from 'react-reconciler/src/ReactInternalTypes';

import {disableStringRefs} from 'shared/ReactFeatureFlags';

function getCacheForType<T>(resourceType: () => T): T {
  throw new Error('Not implemented.');
}

export const DefaultAsyncDispatcher: AsyncDispatcher = ({
  getCacheForType,
}: any);

if (__DEV__ || !disableStringRefs) {
  // Fizz never tracks owner but the JSX runtime looks for this.
  DefaultAsyncDispatcher.getOwner = (): null => {
    return null;
  };
}
