/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';

type WebpackMap = {
  [id: string]: ClientReferenceMetadata,
};

export type BundlerConfig = WebpackMap;

export type ServerReference<T: Function> = T & {
  $$typeof: symbol,
  $$id: string,
  $$bound: Array<ReactModel>,
};

export type ServerReferenceId = string;

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = {
  $$typeof: symbol,
  $$id: string,
  $$async: boolean,
};

export type ClientReferenceMetadata = {
  id: string,
  chunks: Array<string>,
  name: string,
  async: boolean,
};

export type ClientReferenceKey = string;

const CLIENT_REFERENCE_TAG = Symbol.for('react.client.reference');
const SERVER_REFERENCE_TAG = Symbol.for('react.server.reference');

export function getClientReferenceKey(
  reference: ClientReference<any>,
): ClientReferenceKey {
  return reference.$$async ? reference.$$id + '#async' : reference.$$id;
}

export function isClientReference(reference: Object): boolean {
  return reference.$$typeof === CLIENT_REFERENCE_TAG;
}

export function isServerReference(reference: Object): boolean {
  return reference.$$typeof === SERVER_REFERENCE_TAG;
}

export function resolveClientReferenceMetadata<T>(
  config: BundlerConfig,
  clientReference: ClientReference<T>,
): ClientReferenceMetadata {
  const resolvedModuleData = config[clientReference.$$id];
  if (clientReference.$$async) {
    return {
      id: resolvedModuleData.id,
      chunks: resolvedModuleData.chunks,
      name: resolvedModuleData.name,
      async: true,
    };
  } else {
    return resolvedModuleData;
  }
}

export function resolveServerReferenceMetadata<T>(
  config: BundlerConfig,
  serverReference: ServerReference<T>,
): {id: ServerReferenceId, bound: Promise<Array<any>>} {
  return {
    id: serverReference.$$id,
    bound: Promise.resolve(serverReference.$$bound),
  };
}
