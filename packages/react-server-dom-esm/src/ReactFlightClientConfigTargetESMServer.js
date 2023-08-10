/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {preinitModuleForSSR} from 'react-client/src/ReactFlightClientConfig';

export type ModuleLoading =
  | null
  | string
  | {
      prefix: string,
      crossOrigin?: string,
    };

export function prepareDestinationForModuleImpl(
  moduleLoading: ModuleLoading,
  // Chunks are double-indexed [..., idx, filenamex, idy, filenamey, ...]
  mod: string,
) {
  if (typeof moduleLoading === 'string') {
    preinitModuleForSSR(moduleLoading + mod, undefined);
  } else if (moduleLoading !== null) {
    preinitModuleForSSR(moduleLoading.prefix + mod, moduleLoading.crossOrigin);
  }
}
