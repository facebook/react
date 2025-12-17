/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

// Intentionally not using named imports because Rollup uses dynamic
// dispatch for CommonJS interop named imports.
import * as React from 'react';

export const useSyncExternalStore = React.useSyncExternalStore;
