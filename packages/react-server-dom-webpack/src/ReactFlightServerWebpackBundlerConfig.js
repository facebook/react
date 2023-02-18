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
  [filepath: string]: {
    [name: string]: ClientReferenceMetadata,
  },
};

export type BundlerConfig = WebpackMap;

export type ServerReference<T: Function> = T & {
  $$typeof: symbol,
  $$filepath: string,
  $$name: string,
  $$bound: Array<ReactModel>,
};

export type ServerReferenceMetadata = {
  id: string,
  name: string,
  bound: Promise<Array<ReactModel>>,
};

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = {
  $$typeof: symbol,
  filepath: string,
  name: string,
  async: boolean,
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
  return (
    reference.filepath +
    '#' +
    reference.name +
    (reference.async ? '#async' : '')
  );
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
  const resolvedModuleData =
    config[clientReference.filepath][clientReference.name];
  if (clientReference.async) {
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
): ServerReferenceMetadata {
  return {
    id: serverReference.$$filepath,
    name: serverReference.$$name,
    bound: Promise.resolve(serverReference.$$bound),
  };
}
