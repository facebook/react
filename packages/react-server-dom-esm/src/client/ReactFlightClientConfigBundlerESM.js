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
import type {ModuleLoading} from 'react-client/src/ReactFlightClientConfig';

export type ServerConsumerModuleMap = string; // Module root path

export type ServerManifest = string; // Module root path

export type ServerReferenceId = string;

import {prepareDestinationForModuleImpl} from 'react-client/src/ReactFlightClientConfig';

export opaque type ClientReferenceMetadata = [
  string, // module path
  string, // export name
];

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  specifier: string,
  name: string,
};

// The reason this function needs to be defined here in this file instead of just
// being exported directly from the WebpackDestination... file is because the
// ClientReferenceMetadata is opaque and we can't unwrap it there.
// This should get inlined and we could also just implement an unwrapping function
// though that risks it getting used in places it shouldn't be. This is unfortunate
// but currently it seems to be the best option we have.
export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
): void {
  const [modulePath] = metadata; // Destructure for clarity
  prepareDestinationForModuleImpl(moduleLoading, modulePath, nonce);
}

export function resolveClientReference<T>(
  bundlerConfig: ServerConsumerModuleMap,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  const [modulePath, exportName] = metadata; // Destructure for clarity
  return {
    specifier: bundlerConfig + modulePath,
    name: exportName,
  };
}

export function resolveServerReference<T>(
  config: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  const baseURL: string = config;
  const idx = id.lastIndexOf('#');
  const exportName = id.slice(idx + 1);
  const fullURL = id.slice(0, idx);

  if (!fullURL.startsWith(baseURL)) {
    throw new Error(
      'Attempted to load a Server Reference outside the hosted root.',
    );
  }

  return {specifier: fullURL, name: exportName};
}

const asyncModuleCache: Map<string, Thenable<any>> = new Map();

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  const {specifier} = metadata; // Extract `specifier` for clarity
  const existingPromise = asyncModuleCache.get(specifier);

  if (existingPromise) {
    return existingPromise.status === 'fulfilled' ? null : existingPromise;
  }

  // $FlowFixMe[unsupported-syntax]
  const modulePromise: Thenable<T> = import(specifier);

  modulePromise.then(
    value => {
      const fulfilledThenable: FulfilledThenable<mixed> = (modulePromise: any);
      fulfilledThenable.status = 'fulfilled';
      fulfilledThenable.value = value;
    },
    reason => {
      const rejectedThenable: RejectedThenable<mixed> = (modulePromise: any);
      rejectedThenable.status = 'rejected';
      rejectedThenable.reason = reason;
    },
  );

  asyncModuleCache.set(specifier, modulePromise);
  return modulePromise;
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  const {specifier, name} = metadata; // Destructure for clarity
  const promise: any = asyncModuleCache.get(specifier);

  if (promise?.status === 'fulfilled') {
    return promise.value[name];
  }

  throw promise?.reason || new Error(`Module ${specifier} is not preloaded.`);
}
