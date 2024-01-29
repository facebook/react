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

type ResolveClientReferenceFn<T> =
  ClientReferenceMetadata => ClientReference<T>;

export type SSRModuleMap = {
  resolveClientReference?: ResolveClientReferenceFn<any>,
};
export type ServerManifest = string;
export type {
  ClientManifest,
  ServerReferenceId,
  ClientReferenceMetadata,
} from './ReactFlightReferencesFB';

import type {
  ServerReferenceId,
  ClientReferenceMetadata,
} from './ReactFlightReferencesFB';

export type ClientReference<T> = {
  getModuleId: () => string,
  load: () => Thenable<T>,
};

export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
) {
  return;
}

export function resolveClientReference<T>(
  moduleMap: SSRModuleMap,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  if (typeof moduleMap.resolveClientReference === 'function') {
    return moduleMap.resolveClientReference(metadata);
  } else {
    throw new Error(
      'Expected `resolveClientReference` to be defined on the moduleMap.',
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
  const existingPromise = asyncModuleCache.get(clientReference.getModuleId());
  if (existingPromise) {
    if (existingPromise.status === 'fulfilled') {
      return null;
    }
    return existingPromise;
  } else {
    const modulePromise: Thenable<T> = clientReference.load();
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
    asyncModuleCache.set(clientReference.getModuleId(), modulePromise);
    return modulePromise;
  }
}

export function requireModule<T>(clientReference: ClientReference<T>): T {
  let module;
  // We assume that preloadModule has been called before, which
  // should have added something to the module cache.
  const promise: any = asyncModuleCache.get(clientReference.getModuleId());
  if (promise.status === 'fulfilled') {
    module = promise.value;
  } else {
    throw promise.reason;
  }
  // We are currently only support default exports for client components
  return module;
}
