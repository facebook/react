/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CacheDispatcher} from 'react-reconciler/src/ReactInternalTypes';

/**
 * Keeps track of the current Cache dispatcher.
 */
const ReactCurrentCache = {
  current: (null: null | CacheDispatcher),
};

export default ReactCurrentCache;
