/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable, ReactCustomFormAction} from 'shared/ReactTypes';
import type {Result} from 'shared/ReactFlightResult';
import type {
  ServerConsumerModuleMap,
  ModuleLoading,
  ServerManifest,
} from 'react-client/src/ReactFlightClientConfig';
import type {TemporaryReferenceSet} from 'react-client/src/ReactFlightTemporaryReferences';
import type {TemporaryReferenceSet as ServerTemporaryReferenceSet} from 'react-server/src/ReactFlightServerTemporaryReferences';
import type {ClientManifest} from '../server/ReactFlightServerConfigWebpackBundler';

import {
  createResponse,
  getRoot,
  close,
} from 'react-client/src/ReactFlightResultClient';

import {
  isClientReference,
  isServerReference,
} from '../ReactFlightWebpackReferences';
import {
  resolveClientReferenceMetadata,
  getServerReferenceId,
  getServerReferenceBoundArguments,
} from '../server/ReactFlightServerConfigWebpackBundler';
import {resolveTemporaryReference} from 'react-server/src/ReactFlightServerTemporaryReferences';

function noServerCall() {
  throw new Error(
    'Server Functions cannot be called during initial render. ' +
      'This would create a fetch waterfall. Try to use a Server Component ' +
      'to pass data to Client Components instead.',
  );
}

type EncodeFormActionCallback = <A>(
  id: any,
  args: Promise<A>,
) => ReactCustomFormAction;

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
  encodeFormAction?: EncodeFormActionCallback,
  temporaryReferences?: TemporaryReferenceSet,
  onError?: (error: mixed) => ?string,
  // Marks this consumer as done with the Result, like the end of a request.
  signal?: AbortSignal,
};

export function createFromResult<T>(
  result: Result<T>,
  options: Options,
): Thenable<T> {
  const clientManifest = options.clientManifest;
  const serverTemporaryReferences: void | ServerTemporaryReferenceSet =
    result.temporaryReferences;
  const response = createResponse(
    result,
    options.serverConsumerManifest.moduleMap,
    options.serverConsumerManifest.serverModuleMap,
    options.serverConsumerManifest.moduleLoading,
    {
      isClientReference,
      resolveClientReferenceMetadata: reference =>
        resolveClientReferenceMetadata(clientManifest, reference),
      isServerReference,
      getServerReferenceId: reference =>
        getServerReferenceId(clientManifest, reference),
      getServerReferenceBoundArguments: reference =>
        getServerReferenceBoundArguments(clientManifest, reference),
      resolveTemporaryReference: value =>
        serverTemporaryReferences === undefined
          ? undefined
          : resolveTemporaryReference(serverTemporaryReferences, value),
    },
    noServerCall,
    options.encodeFormAction,
    options.temporaryReferences,
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
  return getRoot(response);
}
