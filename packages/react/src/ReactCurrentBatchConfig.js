/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
const ReactCurrentBatchConfig = {
  transition: (0: number),
  _updatedFibers: (null: Set<Fiber> | null),
};

if (__DEV__) {
  ReactCurrentBatchConfig._updatedFibers = new Set();
}

export default ReactCurrentBatchConfig;
