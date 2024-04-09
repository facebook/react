/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AsyncDispatcher} from 'react-reconciler/src/ReactInternalTypes';

function getCacheForType<T>(resourceType: () => T): T {
  throw new Error('Not implemented.');
}

export const DefaultAsyncDispatcher: AsyncDispatcher = {
  getCacheForType,
};
