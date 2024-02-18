/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {
  ImportMetadata,
  ImportManifestEntry,
} from './shared/ReactFlightImportMetadata';

import type {
  ClientReference,
  ServerReference,
} from './ReactFlightParcelReferences';

export type {ClientReference, ServerReference};

export type ClientManifest = {
  [filePath: string]: {
    [name: string]: ImportManifestEntry,
  },
};

export type ServerReferenceId = string;

export type ClientReferenceMetadata = ImportMetadata;
export opaque type ClientReferenceManifestEntry = ImportManifestEntry;

export type ClientReferenceKey = string;

export {
  isClientReference,
  isServerReference,
} from './ReactFlightParcelReferences';

export function getClientReferenceKey(
  reference: ClientReference<any>,
): ClientReferenceKey {
  return reference.id + '#' + reference.name;
}

export function resolveClientReferenceMetadata<T>(
  config: ClientManifest,
  clientReference: ClientReference<T>,
): ClientReferenceMetadata {
  const resolvedModuleData = config[clientReference.id][clientReference.name];
  return [resolvedModuleData.id, resolvedModuleData.name];
}

export function getServerReferenceId<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): ServerReferenceId {
  return serverReference.$$id;
}

export function getServerReferenceBoundArguments<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): null | Array<ReactClientValue> {
  return serverReference.$$bound;
}
