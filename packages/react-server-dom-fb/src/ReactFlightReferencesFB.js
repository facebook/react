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

const registeredClientReferences = new Map<mixed, ClientReferenceKey>();
const registeredServerReferences = new Map<mixed, ServerReferenceId>();

export type ClientReferenceKey = string;
export type ServerReferenceId = string;

export function isClientReference<T>(reference: T): boolean {
  return registeredClientReferences.has(reference);
}

export function isServerReference<T>(reference: T): boolean {
  return registeredServerReferences.has(reference);
}

export function registerClientReference<T>(
  clientReference: ClientReference<T>,
  exportName: string,
): ClientReference<T> {
  registeredClientReferences.set(clientReference, exportName);

  return exportName;
}

export function registerServerReference<T>(
  serverReference: ServerReference<T>,
  exportName: string,
): ServerReference<T> {
  registeredServerReferences.set(serverReference, exportName);

  return exportName;
}

export function getClientReferenceKey<T>(
  clientReference: ClientReference<T>,
): ClientReferenceKey {
  const id = registeredClientReferences.get(clientReference);
  if (id != null) {
    return id;
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
