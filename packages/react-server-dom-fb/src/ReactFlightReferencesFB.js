/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ClientManifest = {[string]: mixed};

// eslint-disable-next-line no-unused-vars
export type ServerReference<T> = string;

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = string;

const registeredClientReferences = new Map<mixed, ClientReferenceMetadata>();
const registeredServerReferences = new Map<mixed, ServerReferenceId>();

export type ClientReferenceKey = string;
export type ServerReferenceId = string;
export type ClientReferenceMetadata = [ClientReferenceKey, string];

export function isClientReference<T>(reference: T): boolean {
  return registeredClientReferences.has(reference);
}

export function isServerReference<T>(reference: T): boolean {
  return registeredServerReferences.has(reference);
}

export function registerClientReference<T>(
  clientReference: ClientReference<T>,
  referenceKey: ClientReferenceKey,
  exportName: string,
): ClientReference<T> {
  registeredClientReferences.set(clientReference, [referenceKey, exportName]);

  return clientReference;
}

export function registerServerReference<T>(
  serverReference: ServerReference<T>,
  exportName: string,
): ServerReference<T> {
  registeredServerReferences.set(serverReference, exportName);

  return serverReference;
}

export function getClientReferenceKey<T>(
  clientReference: ClientReference<T>,
): ClientReferenceKey {
  const record = registeredClientReferences.get(clientReference);
  if (record != null) {
    return record[0];
  }
  throw new Error(
    'Expected client reference ' + clientReference + ' to be registered.',
  );
}

export function resolveClientReferenceMetadata<T>(
  _config: ClientManifest,
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

export function getServerReferenceId<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): ServerReferenceId {
  const id = registeredServerReferences.get(serverReference);
  if (id != null) {
    return id;
  }
  throw new Error(
    'Expected client reference ' + serverReference + ' to be registered.',
  );
}
