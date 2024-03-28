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

import {ID, NAME, BUNDLES} from './shared/ReactFlightImportMetadata';
// $FlowIgnore
import {requireModuleById, loadESMBundle} from '@parcel/intrinsics';

export type ServerManifest = {
  [string]: Array<string>,
};
export type SSRModuleMap = null;
export type ModuleLoading = null;
export type ServerReferenceId = string;

export opaque type ClientReferenceMetadata = ImportMetadata;

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = {
  id: string,
  name: string,
  bundles: Array<string>,
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
    name: metadata[NAME],
    bundles: metadata[BUNDLES],
  };
}

export function resolveServerReference<T>(
  bundlerConfig: ServerManifest,
  ref: ServerReferenceId,
): ClientReference<T> {
  const idx = ref.lastIndexOf('#');
  const id = ref.slice(0, idx);
  const name = ref.slice(idx + 1);
  const bundles = bundlerConfig[id];
  if (!bundles) {
    throw new Error('Invalid server action: ' + ref);
  }
  return {
    id,
    name,
    bundles,
  };
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  return Promise.all(metadata.bundles.map(b => loadESMBundle(b)));
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>(metadata: ClientReference<T>): T {
  const moduleExports = requireModuleById(metadata.id);
  return moduleExports[metadata.name];
}
