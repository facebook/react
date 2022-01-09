/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/************************************************************************
 * This file is forked between different DevTools implementations.
 * It should never be imported directly!
 * It should always be imported from "react-devtools-feature-flags".
 ************************************************************************/

export const consoleManagedByDevToolsDuringStrictMode = false;
export const enableLogger = false;
export const enableNamedHooksFeature = true;
export const enableProfilerChangedHookIndices = true;
export const enableStyleXFeatures = false;
export const isInternalFacebookBuild = false;

/************************************************************************
 * Do not edit the code below.
 * It ensures this fork exports the same types as the default flags file.
 ************************************************************************/

import typeof * as FeatureFlagsType from './DevToolsFeatureFlags.default';
import typeof * as ExportsType from './DevToolsFeatureFlags.core-oss';

// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<ExportsType, FeatureFlagsType>);
