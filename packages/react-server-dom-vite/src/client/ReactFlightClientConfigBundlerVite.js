/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import type {ModuleLoading} from 'react-client/src/ReactFlightClientConfig';

export type ServerConsumerModuleMap = ServerManifest; // Module root path

export type ServerManifest = {
  resolveClientReference<T>(
    metadata: ClientReferenceMetadata,
  ): ClientReference<T>,
  resolveServerReference<T>(id: ServerReferenceId): ClientReference<T>,
}; // API for loading references

export opaque type ClientReference<T> = {
  get(): T,
  preload(): null | Promise<void>,
};

export opaque type ClientReferenceMetadata = mixed;

export type ServerReferenceId = string;

import {prepareDestinationForModuleImpl} from 'react-client/src/ReactFlightClientConfig';

// The reason this function needs to defined here in this file instead of just
// being exported directly from the WebpackDestination... file is because the
// ClientReferenceMetadata is opaque and we can't unwrap it there.
// This should get inlined and we could also just implement an unwrapping function
// though that risks it getting used in places it shouldn't be. This is unfortunate
// but currently it seems to be the best option we have.
export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
) {
  prepareDestinationForModuleImpl(moduleLoading, metadata[0], nonce);
}

export function resolveClientReference<T>(
  bundlerConfig: ServerConsumerModuleMap,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  return bundlerConfig.resolveClientReference(metadata);
}

export function resolveServerReference<T>(
  config: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  return config.resolveServerReference(id);
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  return metadata.preload();
}

export function requireModule<T>(metadata: ClientReference<T>): T {
  return metadata.get();
}
