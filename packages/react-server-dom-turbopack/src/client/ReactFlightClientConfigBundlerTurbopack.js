/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  FulfilledThenable,
  RejectedThenable,
  ReactDebugInfo,
} from 'shared/ReactTypes';

import type {
  ImportMetadata,
  ImportManifestEntry,
} from '../shared/ReactFlightImportMetadata';
import type {ModuleLoading} from 'react-client/src/ReactFlightClientConfig';

import {
  ID,
  CHUNKS,
  NAME,
  isAsyncImport,
} from '../shared/ReactFlightImportMetadata';

import {prepareDestinationWithChunks} from 'react-client/src/ReactFlightClientConfig';

import {
  loadChunk,
  addChunkDebugInfo,
} from 'react-client/src/ReactFlightClientConfig';

export type ServerConsumerModuleMap = null | {
  [clientId: string]: {
    [clientExportName: string]: ClientReferenceManifestEntry,
  },
};

export type ServerManifest = {
  [id: string]: ImportManifestEntry,
};

export type ServerReferenceId = string;

export opaque type ClientReferenceManifestEntry = ImportManifestEntry;
export opaque type ClientReferenceMetadata = ImportMetadata;

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = ClientReferenceMetadata;

// The reason this function needs to defined here in this file instead of just
// being exported directly from the TurbopackDestination... file is because the
// ClientReferenceMetadata is opaque and we can't unwrap it there.
// This should get inlined and we could also just implement an unwrapping function
// though that risks it getting used in places it shouldn't be. This is unfortunate
// but currently it seems to be the best option we have.
export function prepareDestinationForModule(
  moduleLoading: ModuleLoading,
  nonce: ?string,
  metadata: ClientReferenceMetadata,
) {
  prepareDestinationWithChunks(moduleLoading, metadata[CHUNKS], nonce);
}

export function resolveClientReference<T>(
  bundlerConfig: ServerConsumerModuleMap,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  if (bundlerConfig) {
    const moduleExports = bundlerConfig[metadata[ID]];
    let resolvedModuleData = moduleExports && moduleExports[metadata[NAME]];
    let name;
    if (resolvedModuleData) {
      // The potentially aliased name.
      name = resolvedModuleData.name;
    } else {
      // If we don't have this specific name, we might have the full module.
      resolvedModuleData = moduleExports && moduleExports['*'];
      if (!resolvedModuleData) {
        throw new Error(
          'Could not find the module "' +
            metadata[ID] +
            '" in the React Server Consumer Manifest. ' +
            'This is probably a bug in the React Server Components bundler.',
        );
      }
      name = metadata[NAME];
    }
    if (isAsyncImport(metadata)) {
      return [
        resolvedModuleData.id,
        resolvedModuleData.chunks,
        name,
        1 /* async */,
      ];
    } else {
      return [resolvedModuleData.id, resolvedModuleData.chunks, name];
    }
  }
  return metadata;
}

export function resolveServerReference<T>(
  bundlerConfig: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  let name = '';
  let resolvedModuleData = bundlerConfig[id];
  if (resolvedModuleData) {
    // The potentially aliased name.
    name = resolvedModuleData.name;
  } else {
    // We didn't find this specific export name but we might have the * export
    // which contains this name as well.
    // TODO: It's unfortunate that we now have to parse this string. We should
    // probably go back to encoding path and name separately on the client reference.
    const idx = id.lastIndexOf('#');
    if (idx !== -1) {
      name = id.slice(idx + 1);
      resolvedModuleData = bundlerConfig[id.slice(0, idx)];
    }
    if (!resolvedModuleData) {
      throw new Error(
        'Could not find the module "' +
          id +
          '" in the React Server Manifest. ' +
          'This is probably a bug in the React Server Components bundler.',
      );
    }
  }
  // TODO: This needs to return async: true if it's an async module.
  return [resolvedModuleData.id, resolvedModuleData.chunks, name];
}

function requireAsyncModule(id: string): null | Thenable<any> {
  // We've already loaded all the chunks. We can require the module.
  const promise = __turbopack_require__(id);
  if (typeof promise.then !== 'function') {
    // This wasn't a promise after all.
    return null;
  } else if (promise.status === 'fulfilled') {
    // This module was already resolved earlier.
    return null;
  } else {
    // Instrument the Promise to stash the result.
    promise.then(
      value => {
        const fulfilledThenable: FulfilledThenable<mixed> = (promise: any);
        fulfilledThenable.status = 'fulfilled';
        fulfilledThenable.value = value;
      },
      reason => {
        const rejectedThenable: RejectedThenable<mixed> = (promise: any);
        rejectedThenable.status = 'rejected';
        rejectedThenable.reason = reason;
      },
    );
    return promise;
  }
}

// Turbopack will return cached promises for the same chunk.
// We still want to keep track of which chunks we have already instrumented
// and which chunks have already been loaded until Turbopack returns instrumented
// thenables directly.
const instrumentedChunks: WeakSet<Thenable<any>> = new WeakSet();
const loadedChunks: WeakSet<Thenable<any>> = new WeakSet();

function ignoreReject() {
  // We rely on rejected promises to be handled by another listener.
}
// Start preloading the modules since we might need them soon.
// This function doesn't suspend.
export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  const chunks = metadata[CHUNKS];
  const promises: Promise<any>[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkFilename = chunks[i];
    const thenable = loadChunk(chunkFilename);
    if (!loadedChunks.has(thenable)) {
      promises.push(thenable);
    }

    if (!instrumentedChunks.has(thenable)) {
      // $FlowFixMe[method-unbinding]
      const resolve = loadedChunks.add.bind(loadedChunks, thenable);
      thenable.then(resolve, ignoreReject);
      instrumentedChunks.add(thenable);
    }
  }
  if (isAsyncImport(metadata)) {
    if (promises.length === 0) {
      return requireAsyncModule(metadata[ID]);
    } else {
      return Promise.all(promises).then(() => {
        return requireAsyncModule(metadata[ID]);
      });
    }
  } else if (promises.length > 0) {
    return Promise.all(promises);
  } else {
    return null;
  }
}

// Actually require the module or suspend if it's not yet ready.
// Increase priority if necessary.
export function requireModule<T>(metadata: ClientReference<T>): T {
  let moduleExports = __turbopack_require__(metadata[ID]);
  if (isAsyncImport(metadata)) {
    if (typeof moduleExports.then !== 'function') {
      // This wasn't a promise after all.
    } else if (moduleExports.status === 'fulfilled') {
      // This Promise should've been instrumented by preloadModule.
      moduleExports = moduleExports.value;
    } else {
      throw moduleExports.reason;
    }
  }
  if (metadata[NAME] === '*') {
    // This is a placeholder value that represents that the caller imported this
    // as a CommonJS module as is.
    return moduleExports;
  }
  if (metadata[NAME] === '') {
    // This is a placeholder value that represents that the caller accessed the
    // default property of this if it was an ESM interop module.
    return moduleExports.__esModule ? moduleExports.default : moduleExports;
  }
  return moduleExports[metadata[NAME]];
}

export function getModuleDebugInfo<T>(
  metadata: ClientReference<T>,
): null | ReactDebugInfo {
  if (!__DEV__) {
    return null;
  }
  const chunks = metadata[CHUNKS];
  const debugInfo: ReactDebugInfo = [];
  let i = 0;
  while (i < chunks.length) {
    const chunkFilename = chunks[i++];
    addChunkDebugInfo(debugInfo, chunkFilename);
  }
  return debugInfo;
}
