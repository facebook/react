/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

import type {ImportMetadata} from './shared/ReactFlightImportMetadata';

import {ID, NAME} from './shared/ReactFlightImportMetadata';

export type ServerManifest = {
  [string]: () => Promise<any>
};
export type SSRModuleMap = null;
export type ModuleLoading = null;
export type ServerReferenceId = string;

export opaque type ClientReferenceMetadata = ImportMetadata;

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  id: string,
  name: string,
  preload?: () => Promise<any>,
};

export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
) {
  return;
}

export function resolveClientReference<T>(
  bundlerConfig: null,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  // Reference is already resolved during the build.
  return {
    id: metadata[ID],
    name: metadata[NAME]
  };
}

export function resolveServerReference<T>(
  bundlerConfig: ServerManifest,
  ref: ServerReferenceId,
): ClientReference<T> {
  const idx = ref.lastIndexOf('#');
  const id = ref.slice(0, idx);
  const name = ref.slice(idx + 1);
  const preload = bundlerConfig[id];
  if (!preload) {
    throw new Error('Invalid server action: ' + id);
  }
  return {
    id,
    name,
    preload
  };
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  // On the client, the module should already be loaded due to <script> injected into RSC stream.
  // On the server, we may need to load the module containing the action.
  return metadata?.preload?.() || null;
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>(metadata: ClientReference<T>): T {
  const moduleExports = parcelRequire(metadata.id);
  return moduleExports[metadata.name];
}
