/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {preloadModuleForSSR, preinitStyleForSSR} from 'react-client/src/ReactFlightClientConfig';

export type ModuleLoading = null | {
  prefix: string,
  crossOrigin?: 'use-credentials' | '',
};

export function prepareDestinationWithChunks(
  moduleLoading: ModuleLoading,
  chunks: Array<string>,
  nonce: ?string,
) {
  if (moduleLoading !== null) {
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].endsWith('.css')) {
        preinitStyleForSSR(
          moduleLoading.prefix + chunks[i],
          null, // precedence??
          {crossOrigin: moduleLoading.crossOrigin}
        );
      } else {
        // Use preload rather than preinit so the script is not executed until its dependencies
        // are ready. This happens once the parcelRequire call to execute the entry module occurs
        // during bootstrapping.
        preloadModuleForSSR(
          moduleLoading.prefix + chunks[i],
          {
            nonce,
            crossOrigin: moduleLoading.crossOrigin
          },
        );
      }
    }
  }
}
