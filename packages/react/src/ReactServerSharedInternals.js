/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCurrentDispatcher from './ReactCurrentDispatcher';
import ReactCurrentCache from './ReactCurrentCache';

const ReactServerSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentCache,
};

export default ReactServerSharedInternals;
