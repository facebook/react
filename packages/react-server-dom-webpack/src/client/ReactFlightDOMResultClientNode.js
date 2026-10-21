/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import type {Result} from 'shared/ReactFlightResult';
import type {
  ServerConsumerModuleMap,
  ModuleLoading,
  ServerManifest,
} from 'react-client/src/ReactFlightClientConfig';
import type {ClientManifest} from '../server/ReactFlightServerConfigWebpackBundler';

import {
  createResponse,
  readRoot,
  close,
} from 'react-client/src/ReactFlightResultClient';

import {resolveClientReferenceMetadata} from '../server/ReactFlightServerConfigWebpackBundler';

type Options = {
  // The map the Server Components render used, to turn its Client References
  // into the module ids the server consumer manifest is keyed by.
  clientManifest: ClientManifest,
  serverConsumerManifest: {
    moduleMap: ServerConsumerModuleMap,
    moduleLoading: ModuleLoading,
    serverModuleMap: null | ServerManifest,
  },
  nonce?: string,
  onError?: (error: mixed) => ?string,
  signal?: AbortSignal,
};

export function createFromResult<T>(
  result: Result<T>,
  options: Options,
): Thenable<T> {
  const clientManifest = options.clientManifest;
  const response = createResponse(
    result,
    options.serverConsumerManifest.moduleMap,
    options.serverConsumerManifest.moduleLoading,
    reference =>
      resolveClientReferenceMetadata(clientManifest, reference) as any,
    typeof options.nonce === 'string' ? options.nonce : undefined,
    options.onError,
  );
  const signal = options.signal;
  if (signal) {
    if (signal.aborted) {
      close(response, signal.reason);
    } else {
      const listener = () => {
        close(response, signal.reason);
        signal.removeEventListener('abort', listener);
      };
      signal.addEventListener('abort', listener);
    }
  }
  return readRoot(response);
}
