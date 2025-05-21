/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNativeType} from './src/ReactNativeTypes';
import * as ReactNative from './src/ReactNativeRenderer';
// Assert that the exports line up with the type we're going to expose.
(ReactNative: ReactNativeType);

export * from './src/ReactNativeRenderer';
