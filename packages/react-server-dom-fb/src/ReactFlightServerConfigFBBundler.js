/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';

import type {ClientReference, ServerReference} from './ReactFlightReferencesFB';
import type {Thenable} from '../../shared/ReactTypes';

export type {ClientReference, ServerReference};

export type ClientManifest = string;

export type ServerReferenceId = string;

export type ClientReferenceMetadata = [
  string, // module path
  string, // export name
];

export type ClientReferenceKey = string;

export {isClientReference, isServerReference} from './ReactFlightReferencesFB';

export function getClientReferenceKey(
  reference: ClientReference<any>,
): ClientReferenceKey {
  return reference.$$id;
}

export function resolveClientReferenceMetadata<T>(
  config: ClientManifest,
  clientReference: ClientReference<T>,
): ClientReferenceMetadata {
  const baseURL: string = config;
  const id = clientReference.$$id;
  const idx = id.lastIndexOf('#');
  const exportName = id.slice(idx + 1);
  const fullURL = id.slice(0, idx);
  if (!fullURL.startsWith(baseURL)) {
    throw new Error(
      'Attempted to load a Client Module outside the hosted root.',
    );
  }
  // Relative URL
  const modulePath = fullURL.slice(baseURL.length);
  return [modulePath, exportName];
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

// Start preloading the modules since we might need them soon.
// This function doesn't suspend.
export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  throw new Error('Not Implemented.');

  // const chunks = metadata[CHUNKS];
  // const promises = [];
  // let i = 0;
  // while (i < chunks.length) {
  //   const chunkId = chunks[i++];
  //   const chunkFilename = chunks[i++];
  //   const entry = chunkCache.get(chunkId);
  //   if (entry === undefined) {
  //     const thenable = loadChunk(chunkId, chunkFilename);
  //     promises.push(thenable);
  //     // $FlowFixMe[method-unbinding]
  //     const resolve = chunkCache.set.bind(chunkCache, chunkId, null);
  //     thenable.then(resolve, ignoreReject);
  //     chunkCache.set(chunkId, thenable);
  //   } else if (entry !== null) {
  //     promises.push(entry);
  //   }
  // }
  // if (isAsyncImport(metadata)) {
  //   if (promises.length === 0) {
  //     return requireAsyncModule(metadata[ID]);
  //   } else {
  //     return Promise.all(promises).then(() => {
  //       return requireAsyncModule(metadata[ID]);
  //     });
  //   }
  // } else if (promises.length > 0) {
  //   return Promise.all(promises);
  // } else {
  //   return null;
  // }
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>(metadata: ClientReference<T>): T {
  throw new Error('Not Implemented.');
  // let moduleExports = __webpack_require__(metadata[ID]);
  // if (isAsyncImport(metadata)) {
  //   if (typeof moduleExports.then !== 'function') {
  //     // This wasn't a promise after all.
  //   } else if (moduleExports.status === 'fulfilled') {
  //     // This Promise should've been instrumented by preloadModule.
  //     moduleExports = moduleExports.value;
  //   } else {
  //     throw moduleExports.reason;
  //   }
  // }
  // if (metadata[NAME] === '*') {
  //   // This is a placeholder value that represents that the caller imported this
  //   // as a CommonJS module as is.
  //   return moduleExports;
  // }
  // if (metadata[NAME] === '') {
  //   // This is a placeholder value that represents that the caller accessed the
  //   // default property of this if it was an ESM interop module.
  //   return moduleExports.__esModule ? moduleExports.default : moduleExports;
  // }
  // return moduleExports[metadata[NAME]];
}
