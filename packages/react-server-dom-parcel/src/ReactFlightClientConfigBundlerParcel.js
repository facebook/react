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

export type ServerManifest = null;
export type SSRModuleMap = null;
export type ModuleLoading = null;
export type ServerReferenceId = ImportMetadata;

export opaque type ClientReferenceMetadata = ImportMetadata;

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = ClientReferenceMetadata;

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
  return metadata;
}

export function resolveServerReference<T>(
  bundlerConfig: ServerManifest,
  ref: ServerReferenceId,
): ClientReference<T> {
  return ref;
}

export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  // Module should already be loaded due to <script> injected into RSC stream.
  return null;
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>(metadata: ClientReference<T>): T {
  const moduleExports = parcelRequire(metadata[ID]);
  if (metadata[NAME] === '*') {
    // This is a placeholder value that represents that the caller imported this
    // as a CommonJS module as is.
    return moduleExports;
  }
  if (metadata[NAME] === 'default') {
    // This is a placeholder value that represents that the caller accessed the
    // default property of this if it was an ESM interop module.
    return moduleExports.__esModule ? moduleExports.default : moduleExports;
  }
  return moduleExports[metadata[NAME]];
}
