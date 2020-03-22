/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export opaque type ModuleMetaData = {
  id: string,
  chunks: Array<string>,
  name: string,
};

// eslint-disable-next-line no-unused-vars
export opaque type ModuleReference<T> = ModuleMetaData;

export function resolveModuleReference<T>(
  moduleData: ModuleMetaData,
): ModuleReference<T> {
  return moduleData;
}

type Thenable = {
  then(resolve: (any) => mixed, reject?: (Error) => mixed): Thenable,
  ...
};

// The chunk cache contains all the chunks we've preloaded so far.
// If they're still pending they're a thenable. This map also exists
// in Webpack but unfortunately it's not exposed so we have to
// replicate it in user space. null means that it has already loaded.
const chunkCache: Map<string, null | Thenable | Error> = new Map();

// Returning null means that all dependencies are fulfilled and we
// can synchronously require the module now. A thenable is returned
// that when resolved, means we can try again.
export function preloadModule<T>(moduleData: ModuleReference<T>): void {
  let chunks = moduleData.chunks;
  for (let i = 0; i < chunks.length; i++) {
    let chunkId = chunks[i];
    let entry = chunkCache.get(chunkId);
    if (entry === undefined) {
      let thenable = __webpack_chunk_load__(chunkId);
      let resolve = chunkCache.set.bind(chunkCache, chunkId, null);
      let reject = chunkCache.set.bind(chunkCache, chunkId);
      thenable.then(resolve, reject);
      chunkCache.set(chunkId, thenable);
    }
  }
}

export function requireModule<T>(moduleData: ModuleReference<T>): T {
  let chunks = moduleData.chunks;
  for (let i = 0; i < chunks.length; i++) {
    let chunkId = chunks[i];
    let entry = chunkCache.get(chunkId);
    if (entry !== null) {
      // We assume that preloadModule has been called before.
      // So we don't expect to see entry being undefined here, that's an error.
      // Let's throw either an error or the Promise.
      throw entry;
    }
  }
  return __webpack_require__(moduleData.id)[moduleData.name];
}
