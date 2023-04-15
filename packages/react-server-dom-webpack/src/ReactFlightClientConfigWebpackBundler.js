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
} from 'shared/ReactTypes';

export type SSRManifest = null | {
  [clientId: string]: {
    [clientExportName: string]: ClientReferenceMetadata,
  },
};

export type ServerManifest = {
  [id: string]: ClientReference<any>,
};

export type ServerReferenceId = string;

export opaque type ClientReferenceMetadata = {
  id: string,
  chunks: Array<string>,
  name: string,
  async: boolean,
};

// eslint-disable-next-line no-unused-vars
export opaque type ClientReference<T> = ClientReferenceMetadata;

export function resolveClientReference<T>(
  bundlerConfig: SSRManifest,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  if (bundlerConfig) {
    const moduleExports = bundlerConfig[metadata.id];
    let resolvedModuleData = moduleExports[metadata.name];
    let name;
    if (resolvedModuleData) {
      // The potentially aliased name.
      name = resolvedModuleData.name;
    } else {
      // If we don't have this specific name, we might have the full module.
      resolvedModuleData = moduleExports['*'];
      if (!resolvedModuleData) {
        throw new Error(
          'Could not find the module "' +
            metadata.id +
            '" in the React SSR Manifest. ' +
            'This is probably a bug in the React Server Components bundler.',
        );
      }
      name = metadata.name;
    }
    return {
      id: resolvedModuleData.id,
      chunks: resolvedModuleData.chunks,
      name: name,
      async: !!metadata.async,
    };
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
      name = id.substr(idx + 1);
      resolvedModuleData = bundlerConfig[id.substr(0, idx)];
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
  return {
    id: resolvedModuleData.id,
    chunks: resolvedModuleData.chunks,
    name: name,
    async: false,
  };
}

// The chunk cache contains all the chunks we've preloaded so far.
// If they're still pending they're a thenable. This map also exists
// in Webpack but unfortunately it's not exposed so we have to
// replicate it in user space. null means that it has already loaded.
const chunkCache: Map<string, null | Promise<any>> = new Map();
const asyncModuleCache: Map<string, Thenable<any>> = new Map();

function ignoreReject() {
  // We rely on rejected promises to be handled by another listener.
}
// Start preloading the modules since we might need them soon.
// This function doesn't suspend.
export function preloadModule<T>(
  metadata: ClientReference<T>,
): null | Thenable<any> {
  const chunks = metadata.chunks;
  const promises = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = chunks[i];
    const entry = chunkCache.get(chunkId);
    if (entry === undefined) {
      const thenable = __webpack_chunk_load__(chunkId);
      promises.push(thenable);
      // $FlowFixMe[method-unbinding]
      const resolve = chunkCache.set.bind(chunkCache, chunkId, null);
      thenable.then(resolve, ignoreReject);
      chunkCache.set(chunkId, thenable);
    } else if (entry !== null) {
      promises.push(entry);
    }
  }
  if (metadata.async) {
    const existingPromise = asyncModuleCache.get(metadata.id);
    if (existingPromise) {
      if (existingPromise.status === 'fulfilled') {
        return null;
      }
      return existingPromise;
    } else {
      const modulePromise: Thenable<T> = Promise.all(promises).then(() => {
        return __webpack_require__(metadata.id);
      });
      modulePromise.then(
        value => {
          const fulfilledThenable: FulfilledThenable<mixed> =
            (modulePromise: any);
          fulfilledThenable.status = 'fulfilled';
          fulfilledThenable.value = value;
        },
        reason => {
          const rejectedThenable: RejectedThenable<mixed> =
            (modulePromise: any);
          rejectedThenable.status = 'rejected';
          rejectedThenable.reason = reason;
        },
      );
      asyncModuleCache.set(metadata.id, modulePromise);
      return modulePromise;
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
  let moduleExports;
  if (metadata.async) {
    // We assume that preloadModule has been called before, which
    // should have added something to the module cache.
    const promise: any = asyncModuleCache.get(metadata.id);
    if (promise.status === 'fulfilled') {
      moduleExports = promise.value;
    } else {
      throw promise.reason;
    }
  } else {
    moduleExports = __webpack_require__(metadata.id);
  }
  if (metadata.name === '*') {
    // This is a placeholder value that represents that the caller imported this
    // as a CommonJS module as is.
    return moduleExports;
  }
  if (metadata.name === '') {
    // This is a placeholder value that represents that the caller accessed the
    // default property of this if it was an ESM interop module.
    return moduleExports.__esModule ? moduleExports.default : moduleExports;
  }
  return moduleExports[metadata.name];
}
