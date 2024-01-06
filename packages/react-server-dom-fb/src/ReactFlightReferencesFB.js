/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ClientManifest = null;

// eslint-disable-next-line no-unused-vars
export type ServerReference<T> = string;

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = {
  getModuleId(): ClientReferenceKey,
};

const requestedClientReferencesKeys = new Set<ClientReferenceKey>();

export type ClientReferenceKey = string;
export type ClientReferenceMetadata = {
  moduleId: ClientReferenceKey,
  exportName: string,
};

export type ServerReferenceId = string;

let checkIsClientReference: (clientReference: mixed) => boolean;

export function setCheckIsClientReference(
  impl: (clientReference: mixed) => boolean,
): void {
  checkIsClientReference = impl;
}

export function registerClientReference<T>(
  clientReference: ClientReference<T>,
): void {}

export function isClientReference(reference: mixed): boolean {
  if (checkIsClientReference == null) {
    throw new Error('Expected implementation for checkIsClientReference.');
  }
  return checkIsClientReference(reference);
}

export function getClientReferenceKey<T>(
  clientReference: ClientReference<T>,
): ClientReferenceKey {
  const moduleId = clientReference.getModuleId();
  requestedClientReferencesKeys.add(moduleId);

  return clientReference.getModuleId();
}

export function resolveClientReferenceMetadata<T>(
  config: ClientManifest,
  clientReference: ClientReference<T>,
): ClientReferenceMetadata {
  return {moduleId: clientReference.getModuleId(), exportName: 'default'};
}

export function registerServerReference<T>(
  serverReference: ServerReference<T>,
  id: string,
  exportName: null | string,
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
