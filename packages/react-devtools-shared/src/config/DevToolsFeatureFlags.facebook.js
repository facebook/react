/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof * as FeatureFlagsType from './DevToolsFeatureFlags';
import typeof * as FacebookFeatureFlagsType from './DevToolsFeatureFlags.facebook';

export const enableComponentFlagHighHooksUsage = true;
export const enableProfilerShowChangedHooksIndices = true;

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<FacebookFeatureFlagsType, FeatureFlagsType>);
