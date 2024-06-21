/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

export const enableLogger = false;
export const enableStyleXFeatures = false;
export const isInternalFacebookBuild = false;

/************************************************************************
 * Do not edit the code below.
 * It ensures this fork exports the same types as the default flags file.
 ************************************************************************/

import typeof * as FeatureFlagsType from './DevToolsFeatureFlags.default';
import typeof * as ExportsType from './DevToolsFeatureFlags.extension-oss';

// Flow magic to verify the exports of this file match the original version.
((((null: any): ExportsType): FeatureFlagsType): ExportsType);
