/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';

export type ModuleLoading = mixed;
export type SSRModuleMap = mixed;
export type ServerManifest = string; // Module root path
export type {
  ClientManifest,
  ServerReferenceId,
} from './ReactFlightReferencesFB';

import type {ServerReferenceId} from './ReactFlightReferencesFB';

export opaque type ClientReferenceMetadata = [
  string, // module path
  string, // export name
];

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  specifier: string,
  name: string,
  loadModule: () => Thenable<T>,
};

export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
) {
  return;
}

export function resolveClientReference<T>(
  bundlerConfig: SSRModuleMap,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  // $FlowFixMe
  if (typeof bundlerConfig.resolveClientReference === 'function') {
    return bundlerConfig.resolveClientReference(metadata);
  } else {
    throw new Error(
      'Expected `resolveClientReference` to be defined on the bundlerConfig.',
    );
  }
}

export function resolveServerReference<T>(
  config: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  throw new Error('Not implemented');
}

const asyncModuleCache: Map<string, Thenable<any>> = new Map();

export function preloadModule<T>(
  clientReference: ClientReference<T>,
): null | Thenable<any> {
  const existingPromise = asyncModuleCache.get(clientReference.specifier);
  if (existingPromise) {
    if (existingPromise.status === 'fulfilled') {
      return null;
    }
    return existingPromise;
  } else {
    const modulePromise: Thenable<T> = clientReference.loadModule();
    modulePromise.then(
      value => {
        const fulfilledThenable: FulfilledThenable<mixed> =
          (modulePromise: any);
        fulfilledThenable.status = 'fulfilled';
        fulfilledThenable.value = value;
      },
      reason => {
        const rejectedThenable: RejectedThenable<mixed> = (modulePromise: any);
        rejectedThenable.status = 'rejected';
        rejectedThenable.reason = reason;
      },
    );
    asyncModuleCache.set(clientReference.specifier, modulePromise);
    return modulePromise;
  }
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  let moduleExports;
  // We assume that preloadModule has been called before, which
  // should have added something to the module cache.
  const promise: any = asyncModuleCache.get(metadata.specifier);
  if (promise.status === 'fulfilled') {
    moduleExports = promise.value;
  } else {
    throw promise.reason;
  }
  return moduleExports[metadata.name];
}
