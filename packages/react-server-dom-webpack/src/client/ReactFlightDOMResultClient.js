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
  getRoot,
} from 'react-client/src/ReactFlightResultClient';

import {isClientReference} from '../ReactFlightWebpackReferences';
import {resolveClientReferenceMetadata} from '../server/ReactFlightServerConfigWebpackBundler';

export type Options = {
  // The manifest the Server Components were rendered with, to turn their
  // Client References into the module ids the server consumer manifest is
  // keyed by. The serializer uses it the same way.
  clientManifest: ClientManifest,
  serverConsumerManifest: {
    moduleMap: ServerConsumerModuleMap,
    moduleLoading: ModuleLoading,
    serverModuleMap: null | ServerManifest,
  },
  nonce?: string,
  onError?: (error: mixed) => ?string,
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
    {
      isClientReference,
      resolveClientReferenceMetadata: reference =>
        resolveClientReferenceMetadata(clientManifest, reference),
    },
    typeof options.nonce === 'string' ? options.nonce : undefined,
    options.onError,
  );
  return getRoot(response);
}
