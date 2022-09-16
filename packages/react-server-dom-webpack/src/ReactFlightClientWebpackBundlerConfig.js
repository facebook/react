/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

export type WebpackSSRMap = {
  [clientId: string]: {
    [clientExportName: string]: ModuleMetaData,
  },
};

export type BundlerConfig = null | WebpackSSRMap;

export opaque type ModuleMetaData = {
  id: string,
  chunks: Array<string>,
  name: string,
  async: boolean,
};

// eslint-disable-next-line no-unused-vars
export opaque type ModuleReference<T> = ModuleMetaData;

export function resolveModuleReference<T>(
  bundlerConfig: BundlerConfig,
  moduleData: ModuleMetaData,
): ModuleReference<T> {
  if (bundlerConfig) {
    const resolvedModuleData = bundlerConfig[moduleData.id][moduleData.name];
    if (moduleData.async) {
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
  return moduleData;
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
  moduleData: ModuleReference<T>,
): null | Thenable<any> {
  const chunks = moduleData.chunks;
  const promises = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = chunks[i];
    const entry = chunkCache.get(chunkId);
    if (entry === undefined) {
      const thenable = __webpack_chunk_load__(chunkId);
      promises.push(thenable);
      const resolve = chunkCache.set.bind(chunkCache, chunkId, null);
      thenable.then(resolve, ignoreReject);
      chunkCache.set(chunkId, thenable);
    } else if (entry !== null) {
      promises.push(entry);
    }
  }
  if (moduleData.async) {
    const existingPromise = asyncModuleCache.get(moduleData.id);
    if (existingPromise) {
      if (existingPromise.status === 'fulfilled') {
        return null;
      }
      return existingPromise;
    } else {
      const modulePromise: Thenable<T> = Promise.all(promises).then(() => {
        return __webpack_require__(moduleData.id);
      });
      modulePromise.then(
        value => {
          const fulfilledThenable: FulfilledThenable<mixed> = (modulePromise: any);
          fulfilledThenable.status = 'fulfilled';
          fulfilledThenable.value = value;
        },
        reason => {
          const rejectedThenable: RejectedThenable<mixed> = (modulePromise: any);
          rejectedThenable.status = 'rejected';
          rejectedThenable.reason = reason;
        },
      );
      asyncModuleCache.set(moduleData.id, modulePromise);
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
export function requireModule<T>(moduleData: ModuleReference<T>): T {
  let moduleExports;
  if (moduleData.async) {
    // We assume that preloadModule has been called before, which
    // should have added something to the module cache.
    const promise: any = asyncModuleCache.get(moduleData.id);
    if (promise.status === 'fulfilled') {
      moduleExports = promise.value;
    } else {
      throw promise.reason;
    }
  } else {
    moduleExports = __webpack_require__(moduleData.id);
  }
  if (moduleData.name === '*') {
    // This is a placeholder value that represents that the caller imported this
    // as a CommonJS module as is.
    return moduleExports;
  }
  if (moduleData.name === '') {
    // This is a placeholder value that represents that the caller accessed the
    // default property of this if it was an ESM interop module.
    return moduleExports.__esModule ? moduleExports.default : moduleExports;
  }
  return moduleExports[moduleData.name];
}
