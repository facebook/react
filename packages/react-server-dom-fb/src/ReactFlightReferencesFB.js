/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export opaque type ClientManifest = mixed;

// eslint-disable-next-line no-unused-vars
export type ServerReference<T> = string;

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = string;

const registeredClientReferences = new Map<mixed, ClientReferenceMetadata>();
const requestedClientReferencesKeys = new Set<ClientReferenceKey>();

export type ClientReferenceKey = string;
export type ClientReferenceMetadata = {
  moduleId: ClientReferenceKey,
  exportName: string,
};

export type ServerReferenceId = string;

export function registerClientReference<T>(
  clientReference: ClientReference<T>,
  moduleId: ClientReferenceKey,
): ClientReference<T> {
  const exportName = 'default'; // Currently, we only support modules with `default` export
  registeredClientReferences.set(clientReference, {
    moduleId,
    exportName,
  });

  return clientReference;
}

export function isClientReference<T>(reference: T): boolean {
  return registeredClientReferences.has(reference);
}

export function getClientReferenceKey<T>(
  clientReference: ClientReference<T>,
): ClientReferenceKey {
  const reference = registeredClientReferences.get(clientReference);
  if (reference != null) {
    requestedClientReferencesKeys.add(reference.moduleId);
    return reference.moduleId;
  }

  throw new Error(
    'Expected client reference ' + clientReference + ' to be registered.',
  );
}

export function resolveClientReferenceMetadata<T>(
  config: ClientManifest,
  clientReference: ClientReference<T>,
): ClientReferenceMetadata {
  const metadata = registeredClientReferences.get(clientReference);
  if (metadata != null) {
    return metadata;
  }

  throw new Error(
    'Expected client reference ' + clientReference + ' to be registered.',
  );
}

export function registerServerReference<T>(
  serverReference: ServerReference<T>,
  exportName: string,
): ServerReference<T> {
  throw new Error('registerServerReference: Not Implemented.');
}

export function isServerReference<T>(reference: T): boolean {
  throw new Error('isServerReference: Not Implemented.');
}

export function getServerReferenceId<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): ServerReferenceId {
  throw new Error('getServerReferenceId: Not Implemented.');
}

export function getRequestedClientReferencesKeys(): $ReadOnlyArray<ClientReferenceKey> {
  return Array.from(requestedClientReferencesKeys);
}

export function clearRequestedClientReferencesKeysSet(): void {
  requestedClientReferencesKeys.clear();
}
